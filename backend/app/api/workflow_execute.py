"""Workflow SSE execution route: /api/workflow/{id}/execute."""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from supabase import AsyncClient

from app.core.database import get_db
from app.core.deps import get_current_user, get_supabase_client
from app.engine.events import event_message, parse_sse_frame
from app.engine.executor import execute_workflow
from app.models.workflow import WorkflowExecuteRequest
from app.services.ai_catalog_service import get_sku_by_id, is_tier_allowed
from app.services.usage_ledger import bind_usage_request, create_usage_request, finalize_usage_request

logger = logging.getLogger(__name__)

router = APIRouter()
HEARTBEAT_INTERVAL_SECONDS = 5


def _resolve_requested_graph(
    workflow: dict,
    body: WorkflowExecuteRequest | None,
) -> tuple[list[dict], list[dict]]:
    if body is None or (body.nodes_json is None and body.edges_json is None):
        return workflow.get("nodes_json") or [], workflow.get("edges_json") or []

    if body.nodes_json is None or body.edges_json is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="nodes_json 和 edges_json 必须同时提供，不能只提交半张图",
        )

    return body.nodes_json, body.edges_json


def _format_error_detail(detail: Any) -> str:
    if isinstance(detail, dict):
        return str(detail.get("message") or detail.get("detail") or detail)
    return str(detail)


async def _execute_workflow_sse_impl(
    workflow_id: str,
    body: WorkflowExecuteRequest | None,
    current_user: dict,
    db: AsyncClient,
    service_db: AsyncClient,
):
    """SSE endpoint: execute a workflow and stream node events."""

    async def event_generator():
        queue: asyncio.Queue[dict[str, str] | None] = asyncio.Queue()
        stop_heartbeats = asyncio.Event()
        current_phase = "connected"

        async def emit(event_type: str, data: dict):
            await queue.put(event_message(event_type, data))

        async def emit_workflow_status(phase: str, message: str):
            nonlocal current_phase
            current_phase = phase
            await emit("workflow_status", {
                "workflow_id": workflow_id,
                "phase": phase,
                "message": message,
            })

        async def heartbeat_pump():
            while not stop_heartbeats.is_set():
                try:
                    await asyncio.wait_for(stop_heartbeats.wait(), timeout=HEARTBEAT_INTERVAL_SECONDS)
                    return
                except asyncio.TimeoutError:
                    await emit("heartbeat", {
                        "workflow_id": workflow_id,
                        "phase": current_phase,
                        "ts": datetime.now(timezone.utc).isoformat(),
                    })

        async def producer():
            run_id = str(uuid.uuid4())
            run_status = "completed"
            final_output: dict | None = None
            usage_request = None
            workflow_run_ref: str | None = None
            did_emit_workflow_done = False
            total_tokens = 0

            try:
                await emit_workflow_status("connected", "已建立工作流流式连接")
                await emit_workflow_status("loading", "正在加载工作流图")

                result = (
                    await db.from_("ss_workflows")
                    .select("id,nodes_json,edges_json")
                    .eq("id", workflow_id)
                    .eq("user_id", current_user["id"])
                    .single()
                    .execute()
                )
                if not result.data:
                    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="工作流不存在")

                workflow = result.data
                nodes, edges = _resolve_requested_graph(workflow, body)
                user_id = current_user["id"]
                user_tier = current_user.get("tier", "free")
                workflow_input = next(
                    (
                        (node.get("data") or {}).get("user_content")
                        or (node.get("data") or {}).get("label")
                        for node in nodes
                        if node.get("type") == "trigger_input"
                    ),
                    None,
                )
                implicit_context = {
                    "user_id": user_id,
                    "workflow_id": workflow_id,
                }

                await emit_workflow_status("validating", "正在校验模型权限与执行图")
                for node in nodes:
                    node_data = node.get("data", {})
                    model_route = node_data.get("model_route") or (node_data.get("config") or {}).get("model_route")
                    if not model_route:
                        continue
                    sku = await get_sku_by_id(model_route)
                    if sku and not is_tier_allowed(user_tier, sku.required_tier):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail={
                                "code": "MODEL_TIER_FORBIDDEN",
                                "message": (
                                    f"节点使用了当前会员等级（{user_tier}）无权访问的模型："
                                    f"{sku.display_name}，请升级会员后再执行"
                                ),
                                "model": sku.model_id,
                                "required_tier": sku.required_tier,
                                "current_tier": user_tier,
                            },
                        )

                await emit_workflow_status("preparing", "正在创建执行上下文")
                started_at = datetime.now(timezone.utc).isoformat()
                try:
                    await service_db.from_("ss_workflow_runs").insert({
                        "id": run_id,
                        "workflow_id": workflow_id,
                        "user_id": user_id,
                        "input": workflow_input,
                        "status": "running",
                        "started_at": started_at,
                    }).execute()
                    workflow_run_ref = run_id
                    implicit_context["workflow_run_id"] = run_id
                except Exception as exc:  # noqa: BLE001
                    logger.error("Failed to insert ss_workflow_runs record: %s", exc)

                usage_request = await create_usage_request(
                    user_id=user_id,
                    source_type="workflow",
                    source_subtype="workflow_execute",
                    workflow_id=workflow_id,
                    workflow_run_id=workflow_run_ref,
                )

                async def _save_results(wf_id: str, updated_nodes: list[dict]) -> None:
                    await emit_workflow_status("saving", "正在保存执行结果")
                    await db.from_("ss_workflows").update(
                        {"nodes_json": updated_nodes}
                    ).eq("id", wf_id).eq("user_id", user_id).execute()

                await emit_workflow_status("executing", "正在执行工作流节点")
                with bind_usage_request(usage_request):
                    async for event in execute_workflow(
                        workflow_id,
                        nodes,
                        edges,
                        implicit_context=implicit_context,
                        save_callback=_save_results,
                    ):
                        event_type, payload = parse_sse_frame(event)
                        if not event_type or payload is None:
                            continue
                        await queue.put(event_message(event_type, payload))
                        if event_type == "workflow_done":
                            did_emit_workflow_done = True
                            final_output = payload
                            if payload.get("status") != "completed":
                                run_status = "failed"

                if not did_emit_workflow_done:
                    run_status = "failed"
                    await emit("workflow_done", {
                        "workflow_id": workflow_id,
                        "status": "error",
                        "error": "执行流未正常结束",
                    })
            except HTTPException as exc:
                run_status = "failed"
                await emit("workflow_done", {
                    "workflow_id": workflow_id,
                    "status": "error",
                    "error": _format_error_detail(exc.detail),
                })
            except Exception as exc:  # noqa: BLE001
                run_status = "failed"
                logger.exception("Workflow execution error for run %s: %s", run_id, exc)
                await emit("workflow_done", {
                    "workflow_id": workflow_id,
                    "status": "error",
                    "error": str(exc),
                })
            finally:
                await emit_workflow_status("finalizing", "正在收尾执行状态")
                if usage_request is not None:
                    await finalize_usage_request(usage_request.request_id, run_status)
                    total_tokens = await _load_request_total_tokens(service_db, usage_request.request_id)
                if workflow_run_ref:
                    await _finalize_run(service_db, run_id, run_status, total_tokens, final_output)
                if total_tokens > 0:
                    await _update_usage_daily(service_db, current_user["id"], total_tokens)
                stop_heartbeats.set()
                await queue.put(None)

        producer_task = asyncio.create_task(producer())
        heartbeat_task = asyncio.create_task(heartbeat_pump())

        try:
            while True:
                item = await queue.get()
                if item is None:
                    break
                yield item
        finally:
            stop_heartbeats.set()
            await asyncio.gather(producer_task, heartbeat_task, return_exceptions=True)

    return EventSourceResponse(event_generator())


@router.get("/{workflow_id}/execute")
async def execute_workflow_sse(
    workflow_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
    service_db: AsyncClient = Depends(get_db),
):
    """Deprecated GET execute endpoint kept for older clients."""
    return await _execute_workflow_sse_impl(
        workflow_id=workflow_id,
        body=None,
        current_user=current_user,
        db=db,
        service_db=service_db,
    )


@router.post("/{workflow_id}/execute")
async def execute_workflow_sse_post(
    workflow_id: str,
    body: WorkflowExecuteRequest | None = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
    service_db: AsyncClient = Depends(get_db),
):
    """POST SSE endpoint that accepts an optional in-memory workflow graph."""
    return await _execute_workflow_sse_impl(
        workflow_id=workflow_id,
        body=body,
        current_user=current_user,
        db=db,
        service_db=service_db,
    )


async def _finalize_run(
    db: AsyncClient,
    run_id: str,
    run_status: str,
    total_tokens: int,
    final_output: dict | None,
) -> None:
    """Update ss_workflow_runs with completion data."""
    completed_at = datetime.now(timezone.utc).isoformat()
    try:
        payload: dict = {
            "status": run_status,
            "completed_at": completed_at,
            "tokens_used": total_tokens,
        }
        if final_output is not None:
            current = (
                await db.from_("ss_workflow_runs")
                .select("output")
                .eq("id", run_id)
                .single()
                .execute()
            )
            current_output = current.data.get("output") if current.data else {}
            if not isinstance(current_output, dict):
                current_output = {}
            current_output["workflow_status"] = final_output
            payload["output"] = current_output
        await db.from_("ss_workflow_runs").update(payload).eq("id", run_id).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to update ss_workflow_runs record %s: %s", run_id, exc)


async def _load_request_total_tokens(db: AsyncClient, request_id: str) -> int:
    result = (
        await db.from_("ss_ai_usage_events")
        .select("total_tokens")
        .eq("request_id", request_id)
        .eq("status", "success")
        .execute()
    )
    return sum(int(row.get("total_tokens") or 0) for row in (result.data or []))


async def _update_usage_daily(
    db: AsyncClient,
    user_id: str,
    total_tokens: int,
) -> None:
    """Increment ss_usage_daily executions_count and tokens_used."""
    today = datetime.now(timezone.utc).date().isoformat()
    try:
        existing = (
            await db.from_("ss_usage_daily")
            .select("executions_count,tokens_used")
            .eq("user_id", user_id)
            .eq("date", today)
            .execute()
        )
        if existing.data:
            row = existing.data[0]
            await db.from_("ss_usage_daily").update({
                "executions_count": (row.get("executions_count") or 0) + 1,
                "tokens_used": (row.get("tokens_used") or 0) + total_tokens,
            }).eq("user_id", user_id).eq("date", today).execute()
        else:
            await db.from_("ss_usage_daily").insert({
                "user_id": user_id,
                "date": today,
                "executions_count": 1,
                "tokens_used": total_tokens,
            }).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("Failed to update ss_usage_daily for user %s: %s", user_id, exc)
