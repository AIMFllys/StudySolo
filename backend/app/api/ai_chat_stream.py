"""AI Chat Stream route: /api/ai/chat-stream — SSE 流式对话.

CHAT 意图下将 AI token 逐字推送给前端。
BUILD/MODIFY/ACTION 意图不流式, 直接返回 JSON event。
"""

import json
import logging
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from app.core.deps import get_current_user
from app.models.ai_chat import AIChatRequest
from app.prompts import (
    get_intent_system_prompt,
    get_modify_system_prompt,
    get_chat_system_prompt,
)
from app.services.ai_router import call_llm, AIRouterError
from app.api.ai_chat import _build_canvas_summary, _call_with_model, _extract_json_obj

logger = logging.getLogger(__name__)
stream_router = APIRouter()

# 思考深度 → prompt 前缀
_DEPTH_INSTRUCTIONS: dict[str, str] = {
    "fast": "请快速简洁地回答, 不需要展开细节。",
    "balanced": "请给出完整但有条理的回答。",
    "deep": "请深入思考, 从多角度详细分析, 给出专业级回答。",
}


async def _chat_stream_generator(body: AIChatRequest):
    """SSE 事件生成器 — CHAT 意图流式, 其他意图单次 JSON。"""
    canvas_summary = _build_canvas_summary(body.canvas_context)
    has_canvas = bool(body.canvas_context and body.canvas_context.nodes)
    depth_instruction = _DEPTH_INSTRUCTIONS.get(body.thinking_level, "")

    history_msgs = [
        {"role": m.role, "content": m.content}
        for m in (body.conversation_history or [])[-10:]
    ]

    # ── Step 1: 意图分类 ────────────────────────────────
    intent = body.intent_hint or "CHAT"

    if not body.intent_hint or body.intent_hint not in (
        "BUILD", "MODIFY", "CHAT", "ACTION",
    ):
        classify_msgs = [
            {"role": "system", "content": get_intent_system_prompt(canvas_summary)},
            *history_msgs,
            {"role": "user", "content": body.user_input},
        ]
        try:
            raw, _, _ = await _call_with_model(
                body.selected_platform, body.selected_model, classify_msgs,
            )
            parsed = _extract_json_obj(raw)
            intent = parsed.get("intent", "CHAT")
            if intent not in ("BUILD", "MODIFY", "CHAT", "ACTION"):
                intent = "CHAT"
        except Exception:
            intent = "BUILD" if not has_canvas else "CHAT"

    # ── Non-streaming intents: yield single event ───────
    if intent in ("BUILD", "ACTION"):
        yield {
            "data": json.dumps(
                {"intent": intent, "done": True, "response": "正在跳转..."},
                ensure_ascii=False,
            )
        }
        return

    if intent == "MODIFY":
        system_content = get_modify_system_prompt(canvas_summary)
        if depth_instruction:
            system_content = f"{depth_instruction}\n\n{system_content}"
        modify_msgs = [
            {"role": "system", "content": system_content},
            *history_msgs,
            {"role": "user", "content": body.user_input},
        ]
        try:
            raw, plat, mdl = await _call_with_model(
                body.selected_platform, body.selected_model, modify_msgs,
            )
            parsed = _extract_json_obj(raw)
            yield {
                "data": json.dumps(
                    {
                        "intent": "MODIFY",
                        "done": True,
                        "response": parsed.get("response", "修改已完成。"),
                        "actions": parsed.get("actions", []),
                        "model_used": mdl,
                    },
                    ensure_ascii=False,
                )
            }
        except Exception as e:
            yield {
                "data": json.dumps(
                    {"intent": "MODIFY", "done": True, "response": str(e)},
                    ensure_ascii=False,
                )
            }
        return

    # ── CHAT: stream tokens ──────────────────────────────
    system_content = get_chat_system_prompt(canvas_summary)
    if depth_instruction:
        system_content = f"{depth_instruction}\n\n{system_content}"

    chat_msgs = [
        {"role": "system", "content": system_content},
        *history_msgs,
        {"role": "user", "content": body.user_input},
    ]

    try:
        yield {"data": json.dumps({"intent": "CHAT"}, ensure_ascii=False)}

        # call_llm is async def → must await even for stream=True
        token_iter: AsyncIterator[str] = await call_llm(
            "chat_response", chat_msgs, stream=True,
        )

        full = ""
        async for token in token_iter:
            full += token
            yield {"data": json.dumps({"token": token}, ensure_ascii=False)}

        yield {
            "data": json.dumps({"done": True, "full": full}, ensure_ascii=False),
        }
        yield {"data": "[DONE]"}

    except AIRouterError as e:
        yield {
            "data": json.dumps(
                {"error": str(e), "done": True}, ensure_ascii=False,
            )
        }


@stream_router.post("/chat-stream")
async def ai_chat_stream(
    body: AIChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """SSE 流式 AI 对话."""
    return EventSourceResponse(_chat_stream_generator(body))
