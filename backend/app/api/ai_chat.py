"""AI Chat routes: /api/ai/chat — 统一对话入口.

支持四种意图: BUILD / MODIFY / CHAT / ACTION.
用户可选择模型 (platform + model), 默认走 config.yaml 路由链。
"""

import json
import logging
import re

from fastapi import APIRouter, Depends, HTTPException
from openai import AsyncOpenAI, APITimeoutError, APIError

from app.core.deps import get_current_user
from app.core.config_loader import get_config
from app.models.ai_chat import (
    AIChatRequest,
    AIChatResponse,
    CanvasAction,
)
from app.prompts import (
    get_intent_system_prompt,
    get_modify_system_prompt,
    get_chat_system_prompt,
)
from app.services.ai_router import call_llm

logger = logging.getLogger(__name__)
router = APIRouter()

_JSON_PATTERN = re.compile(r"```(?:json)?\s*([\s\S]+?)```")
_OBJ_PATTERN = re.compile(r"(\{[\s\S]*\})")


def _extract_json_obj(text: str) -> dict:
    """从 AI 响应中提取 JSON 对象."""
    m = _JSON_PATTERN.search(text)
    raw = m.group(1).strip() if m else text.strip()
    m2 = _OBJ_PATTERN.search(raw)
    if m2:
        raw = m2.group(1).strip()
    return json.loads(raw)


def _build_canvas_summary(ctx) -> str:
    """将画布上下文序列化为 AI 可读文本."""
    if not ctx or not ctx.nodes:
        return "画布为空, 没有任何节点。"

    lines = [f"工作流: {ctx.workflow_name or '未命名'}"]
    lines.append(f"节点数量: {len(ctx.nodes)}")
    if ctx.execution_status:
        lines.append(f"执行状态: {ctx.execution_status}")
    lines.append("")

    for n in ctx.nodes:
        status = f" [{n.status}]" if n.status != "pending" else ""
        up = f" ← {', '.join(n.upstream_labels)}" if n.upstream_labels else ""
        down = f" → {', '.join(n.downstream_labels)}" if n.downstream_labels else ""
        preview = f"  输出预览: {n.output_preview}" if n.has_output else ""
        pos = f" @({int(n.position.get('x',0))},{int(n.position.get('y',0))})"
        lines.append(f"  #{n.index + 1} [{n.type}] \"{n.label}\"{pos}{status}{up}{down}")
        if preview:
            lines.append(f"    {preview}")

    if ctx.dag_description:
        lines.append(f"\nDAG: {ctx.dag_description}")
    if ctx.selected_node_id:
        sel = next((n for n in ctx.nodes if n.id == ctx.selected_node_id), None)
        if sel:
            lines.append(f"\n当前选中: #{sel.index + 1} \"{sel.label}\"")

    return "\n".join(lines)


async def _call_with_model(
    platform: str | None,
    model: str | None,
    messages: list[dict],
) -> tuple[str, str, str]:
    """调用指定模型或默认链, 返回 (content, platform_used, model_used)."""
    if platform and model:
        cfg = get_config()
        plat_cfg = cfg.get("platforms", {}).get(platform)
        if not plat_cfg:
            raise HTTPException(400, f"未知平台: {platform}")

        base_url = str(plat_cfg.get("base_url", ""))
        api_key = str(plat_cfg.get("api_key", ""))
        if base_url.startswith("$") or api_key.startswith("$"):
            raise HTTPException(503, f"平台 {platform} 未配置 API Key")

        client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
            timeout=cfg["fallback"]["timeout_ms"] / 1000,
        )
        try:
            resp = await client.chat.completions.create(
                model=model, messages=messages, stream=False,
            )
            return resp.choices[0].message.content or "", platform, model
        except (APITimeoutError, APIError) as e:
            logger.warning("User-selected model %s/%s failed: %s", platform, model, e)
            raise HTTPException(503, f"模型调用失败: {e}") from e

    content = await call_llm("chat_response", messages, stream=False)
    return content, "default", "default"


@router.post("/chat", response_model=AIChatResponse)
async def ai_chat(
    body: AIChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """统一 AI 对话入口 — 意图分类 + 执行."""
    canvas_summary = _build_canvas_summary(body.canvas_context)
    has_canvas = bool(body.canvas_context and body.canvas_context.nodes)

    # ── 快速 ACTION 检测 (前端高置信度, 跳过 AI) ───────────────
    if body.intent_hint == "ACTION":
        return AIChatResponse(
            intent="ACTION",
            response="正在执行操作...",
            model_used="none",
            platform_used="none",
        )

    # ── 构建对话 messages ────────────────────────────────────────
    history_msgs = [
        {"role": m.role, "content": m.content}
        for m in (body.conversation_history or [])[-10:]
    ]

    # ── Step 1: 意图分类 ─────────────────────────────────────────
    if body.intent_hint and body.intent_hint in ("BUILD", "MODIFY", "CHAT"):
        intent = body.intent_hint
    else:
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

    # ── Step 2: 按意图执行 ───────────────────────────────────────
    if intent == "BUILD":
        return AIChatResponse(
            intent="BUILD",
            response="正在为你生成工作流...",
            model_used=body.selected_model or "default",
            platform_used=body.selected_platform or "default",
        )

    if intent == "MODIFY":
        modify_msgs = [
            {"role": "system", "content": get_modify_system_prompt(canvas_summary)},
            *history_msgs,
            {"role": "user", "content": body.user_input},
        ]
        raw, plat, mdl = await _call_with_model(
            body.selected_platform, body.selected_model, modify_msgs,
        )
        try:
            parsed = _extract_json_obj(raw)
            actions = [CanvasAction(**a) for a in parsed.get("actions", [])]
            response_text = parsed.get("response", "修改已完成。")
        except (json.JSONDecodeError, KeyError):
            actions = None
            response_text = raw

        return AIChatResponse(
            intent="MODIFY",
            response=response_text,
            actions=actions,
            model_used=mdl,
            platform_used=plat,
        )

    # CHAT (default)
    chat_msgs = [
        {"role": "system", "content": get_chat_system_prompt(canvas_summary)},
        *history_msgs,
        {"role": "user", "content": body.user_input},
    ]
    raw, plat, mdl = await _call_with_model(
        body.selected_platform, body.selected_model, chat_msgs,
    )
    return AIChatResponse(
        intent="CHAT",
        response=raw,
        model_used=mdl,
        platform_used=plat,
    )
