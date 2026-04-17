"""Tools that kick off and poll background workflow runs."""

from __future__ import annotations

import logging
from typing import Any

from app.services.workflow_runs_service import StartRunError, get_run_status, start_run

from .base import ToolContext, ToolResult, register

logger = logging.getLogger(__name__)


@register(
    name="start_workflow_background",
    description="将指定工作流排队到后台运行。返回 run_id 和可用于轮询进度的 URL。",
    params_schema={
        "type": "object",
        "required": ["id"],
        "properties": {"id": {"type": "string"}},
    },
)
async def start_workflow_background_tool(
    ctx: ToolContext, params: dict[str, Any]
) -> ToolResult:
    wf_id = str(params.get("id") or "").strip()
    if not wf_id:
        return ToolResult(ok=False, error="缺少参数 id")
    try:
        info = await start_run(
            user=ctx.user,
            workflow_id=wf_id,
            db=ctx.db,
            service_db=ctx.service_db,
            enforce_rate_limit=False,  # agent loop already rate-limited via chat quota
        )
        return ToolResult(ok=True, data=info)
    except StartRunError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")
    except Exception as exc:  # noqa: BLE001
        logger.exception("start_workflow_background failed: %s", exc)
        return ToolResult(ok=False, error=f"后台启动失败: {exc}")


@register(
    name="get_workflow_run_status",
    description="查询一个后台运行的最新状态（queued/running/completed/failed 等）。",
    params_schema={
        "type": "object",
        "required": ["run_id"],
        "properties": {"run_id": {"type": "string"}},
    },
)
async def get_workflow_run_status_tool(
    ctx: ToolContext, params: dict[str, Any]
) -> ToolResult:
    run_id = str(params.get("run_id") or "").strip()
    if not run_id:
        return ToolResult(ok=False, error="缺少参数 run_id")
    try:
        info = await get_run_status(run_id=run_id, user=ctx.user, service_db=ctx.service_db)
        return ToolResult(ok=True, data=info)
    except StartRunError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")
    except Exception as exc:  # noqa: BLE001
        logger.exception("get_workflow_run_status failed: %s", exc)
        return ToolResult(ok=False, error=f"查询运行状态失败: {exc}")
