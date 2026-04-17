"""Backend-orchestrated ReAct agent loop for the AI chat.

Flow (per user turn):
    1. Build system prompt (identity + XML protocol + tool schema + canvas
       snapshot + workflow list summary).
    2. Stream the LLM; feed tokens through :class:`XmlStreamParser`.
    3. Whenever a ``<tool_use>`` closes, the parser emits ``tool_call_ready``.
       We execute the corresponding tool, emit ``tool_call`` / ``tool_result``
       / ``canvas_mutation`` / ``ui_effect`` SSE events, and append a
       ``<tool_result>`` message into the running history for the next round.
    4. On ``<done/>`` OR when the LLM returns no new tool calls (i.e. the
       stream finished without any ``<tool_use>``), we exit.
    5. Hard cap at ``MAX_ROUNDS`` rounds to prevent runaway loops.

Every event we yield is already in the SSE dict form (``{"data": ...}``) so
the API layer just passes them through :class:`EventSourceResponse`.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, AsyncIterator

from app.models.ai_chat import AIChatRequest
from app.prompts import get_agent_xml_prompt
from app.services.ai_catalog_service import resolve_selected_sku
from app.services.ai_chat.helpers import build_canvas_summary
from app.services.ai_chat.thinking import (
    ThinkingLevel,
    resolve_effective_thinking_level,
    should_force_reasoning_model,
)
from app.services.ai_chat.tools import (
    CanvasMutation,
    ToolContext,
    ToolResult,
    UIEffect,
    get_tool,
    iter_tool_specs,
)
from app.services.ai_chat.xml_stream_parser import XmlStreamParser
from app.services.llm.router import (
    AIRouterError,
    call_lightweight_chat_response,
    call_llm_direct,
)

logger = logging.getLogger(__name__)


MAX_ROUNDS = 6
MAX_DUPLICATE_TOOL_CALLS = 3  # same (tool, params) in a row = probable loop
_REASONING_BLOCK_RE = re.compile(
    r"<(?:think|thinking|reasoning)\b[^>]*>[\s\S]*?</(?:think|thinking|reasoning)>",
    re.IGNORECASE,
)


# ── Helpers ──────────────────────────────────────────────────────────────

def _format_tools_block() -> str:
    """Render the tool registry into a prompt-friendly XML snippet."""
    lines: list[str] = []
    for spec in iter_tool_specs():
        lines.append(f"- **{spec.name}** — {spec.description}")
        try:
            schema = json.dumps(spec.params_schema, ensure_ascii=False)
        except (TypeError, ValueError):
            schema = "{}"
        lines.append(f"  参数 JSON schema: `{schema}`")
    return "\n".join(lines) if lines else "（无可用工具）"


async def _build_workflow_list_summary(ctx: ToolContext) -> str:
    """Best-effort: list top workflows for implicit context. Non-fatal."""
    try:
        result = (
            await ctx.db.from_("ss_workflows")
            .select("id,name,updated_at,nodes_json")
            .eq("user_id", ctx.user["id"])
            .order("updated_at", desc=True)
            .limit(15)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return "（用户暂无工作流）"
        lines = []
        for r in rows:
            node_count = len(r.get("nodes_json") or [])
            lines.append(
                f"- id={r['id']} | 名称={(r.get('name') or '未命名')} | 节点数={node_count}"
            )
        return "\n".join(lines)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Failed to build workflow list summary: %s", exc)
        return "（加载工作流列表失败）"


def _sse(data: dict[str, Any]) -> dict[str, str]:
    return {"data": json.dumps(data, ensure_ascii=False)}


def _serialize_canvas_mutation(m: CanvasMutation) -> dict[str, Any]:
    return {
        "workflow_id": m.workflow_id,
        "nodes": m.nodes,
        "edges": m.edges,
    }


def _serialize_ui_effect(u: UIEffect) -> dict[str, Any]:
    return {"type": u.type, "url": u.url, "payload": u.payload}


def _strip_reasoning_blocks(text: str) -> str:
    """Remove model reasoning blocks before feeding assistant XML into history."""
    return _REASONING_BLOCK_RE.sub("", text)


async def _get_token_iter(
    selected_sku,
    stream_msgs: list[dict[str, str]],
    effective_thinking_level: ThinkingLevel,
) -> AsyncIterator[str]:
    if selected_sku:
        return await call_llm_direct(
            selected_sku.provider,
            selected_sku.model_id,
            stream_msgs,
            stream=True,
        )
    if should_force_reasoning_model(selected_sku, effective_thinking_level):
        return await call_llm_direct(
            "deepseek",
            "deepseek-reasoner",
            stream_msgs,
            stream=True,
        )
    return await call_lightweight_chat_response(stream_msgs, stream=True)


# ── Main entry point ────────────────────────────────────────────────────

async def run_agent_loop(
    body: AIChatRequest,
    current_user: dict,
    *,
    db,
    service_db,
) -> AsyncIterator[dict[str, str]]:
    """Run the ReAct loop for one user turn, yielding SSE-ready events."""
    selected_sku = await resolve_selected_sku(
        selected_model_key=body.selected_model_key,
        selected_platform=body.selected_platform,
        selected_model=body.selected_model,
    )

    canvas_summary = build_canvas_summary(body.canvas_context)
    model_identity = selected_sku.display_name if selected_sku else "StudySolo 默认模型"
    workflow_id = body.canvas_context.workflow_id if body.canvas_context else None

    ctx = ToolContext(
        user=current_user,
        db=db,
        service_db=service_db,
        workflow_id=workflow_id,
    )
    workflow_list = await _build_workflow_list_summary(ctx)
    tools_block = _format_tools_block()

    system_prompt = get_agent_xml_prompt(
        canvas_summary=canvas_summary,
        workflow_list_summary=workflow_list,
        tools_block=tools_block,
        model_identity=model_identity,
    )

    history_msgs = [
        {"role": m.role, "content": m.content}
        for m in (body.conversation_history or [])[-20:]
    ]
    messages: list[dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        *history_msgs,
        {"role": "user", "content": body.user_input},
    ]

    effective_thinking_level = resolve_effective_thinking_level(
        body.thinking_level,
        selected_sku,
    )

    # Emit initial intent event so frontend can mark message as "agent".
    yield _sse({"event": "agent_start", "intent": "AGENT", "mode": body.mode})

    recent_calls: list[tuple[str, str]] = []
    done_flag = False

    for round_idx in range(MAX_ROUNDS):
        yield _sse({"event": "round_start", "round": round_idx + 1})

        parser = XmlStreamParser()
        assistant_chunks: list[str] = []
        pending_tool_calls: list[dict[str, Any]] = []

        try:
            token_iter = await _get_token_iter(selected_sku, messages, effective_thinking_level)
        except AIRouterError as exc:
            logger.warning("agent loop: LLM router error: %s", exc)
            yield _sse({"event": "error", "error": "AI 模型调用失败，请稍后重试", "done": True})
            yield {"data": "[DONE]"}
            return

        async for token in token_iter:
            assistant_chunks.append(token)
            for ev in parser.feed(token):
                forwarded = _forward_parser_event(ev, pending_tool_calls)
                if forwarded is not None:
                    yield forwarded

        for ev in parser.close():
            forwarded = _forward_parser_event(ev, pending_tool_calls)
            if forwarded is not None:
                yield forwarded

        assistant_full = "".join(assistant_chunks)
        # Append assistant XML to history, excluding R1 reasoning so later rounds
        # do not accumulate hidden chain-of-thought tokens.
        messages.append({"role": "assistant", "content": _strip_reasoning_blocks(assistant_full)})

        # Detect <done/>.
        if "<done" in assistant_full:
            done_flag = True

        if not pending_tool_calls:
            # No tool calls this round → terminal.
            break

        # Execute tool calls sequentially (keeps deterministic DB ordering).
        tool_results_payload: list[str] = []
        for call in pending_tool_calls:
            tool_name = call.get("tool", "")
            params = call.get("params") or {}
            call_id = call.get("call_id", "")

            signature = (tool_name, json.dumps(params, sort_keys=True, ensure_ascii=False))
            recent_calls.append(signature)
            recent_calls = recent_calls[-MAX_DUPLICATE_TOOL_CALLS:]
            if (
                len(recent_calls) == MAX_DUPLICATE_TOOL_CALLS
                and all(c == signature for c in recent_calls)
            ):
                yield _sse({
                    "event": "warning",
                    "message": f"tool {tool_name} 重复调用 {MAX_DUPLICATE_TOOL_CALLS} 次，已强制中断",
                })
                done_flag = True
                break

            spec = get_tool(tool_name)
            if not spec:
                result = ToolResult(ok=False, error=f"未知工具: {tool_name}")
            else:
                yield _sse({
                    "event": "tool_call",
                    "tool": tool_name,
                    "params": params,
                    "call_id": call_id,
                    "status": "running",
                })
                try:
                    result = await spec.handler(ctx, params)
                except Exception as exc:  # noqa: BLE001
                    logger.exception("tool %s crashed: %s", tool_name, exc)
                    result = ToolResult(ok=False, error=f"工具执行异常: {exc}")

            result_payload = result.to_llm_payload()
            yield _sse({
                "event": "tool_result",
                "tool": tool_name,
                "call_id": call_id,
                "ok": result.ok,
                "data": result_payload.get("data"),
                "error": result.error,
            })
            if result.canvas_mutation is not None:
                yield _sse({
                    "event": "canvas_mutation",
                    **_serialize_canvas_mutation(result.canvas_mutation),
                })
            if result.ui_effect is not None:
                yield _sse({
                    "event": "ui_effect",
                    **_serialize_ui_effect(result.ui_effect),
                })

            tool_results_payload.append(
                f"<tool_result call_id=\"{call_id}\" tool=\"{tool_name}\">\n"
                f"{json.dumps(result_payload, ensure_ascii=False)}\n"
                f"</tool_result>"
            )

        if done_flag:
            break

        # Feed tool results back as a user-turn reply.
        messages.append(
            {
                "role": "user",
                "content": (
                    "以下是你上一轮工具调用的结果，请基于这些结果继续执行下一步，"
                    "直到最终可以输出 <answer> + <summary> + <done/>:\n\n"
                    + "\n".join(tool_results_payload)
                ),
            }
        )
    else:
        # Loop exhausted.
        yield _sse({
            "event": "warning",
            "message": f"已达到最大轮次 {MAX_ROUNDS}，强制结束",
        })

    yield _sse({"event": "agent_end", "done": True})
    yield {"data": "[DONE]"}


def _forward_parser_event(
    ev: dict[str, Any],
    pending_tool_calls: list[dict[str, Any]],
) -> dict[str, str] | None:
    """Convert a parser event into an SSE payload; collect tool calls."""
    t = ev.get("type")
    if t == "segment_start":
        return _sse({"event": "segment_start", "tag": ev["tag"], "attrs": ev.get("attrs", {})})
    if t == "segment_delta":
        return _sse({"event": "segment_delta", "tag": ev["tag"], "delta": ev["delta"]})
    if t == "segment_end":
        return _sse({"event": "segment_end", "tag": ev["tag"]})
    if t == "text":
        # Stray text outside all segments — forward as segment_delta answer.
        return _sse({"event": "segment_delta", "tag": "answer", "delta": ev["delta"]})
    if t == "tool_call_ready":
        pending_tool_calls.append(ev)
        return None  # tool_call SSE is emitted after we actually run it
    if t == "done":
        return _sse({"event": "llm_done_tag"})
    return None


__all__ = ["run_agent_loop", "MAX_ROUNDS"]
