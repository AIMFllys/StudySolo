"""AI workflow generation routes: /api/ai/*"""

import json
import logging
import os
import re

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from app.core.deps import get_current_user
from app.models.ai import (
    AnalyzerOutput,
    GenerateWorkflowRequest,
    GenerateWorkflowResponse,
    ImplicitContext,
    NodeData,
    NodePosition,
    PlannerOutput,
    SYSTEM_PROMPTS,
    NodeType,
    WorkflowNodeSchema,
    WorkflowEdgeSchema,
)
from app.services.ai_router import call_llm, AIRouterError
from app.core.config_loader import get_config
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Prompt injection protection ──────────────────────────────────────────────

_INJECTION_PATTERNS = [
    re.compile(r"忽略(以上|上面|前面|之前)(所有|全部)?指令", re.IGNORECASE),
    re.compile(r"ignore (all |previous |above )?instructions?", re.IGNORECASE),
    re.compile(r"^system\s*:", re.IGNORECASE | re.MULTILINE),
    re.compile(r"<\s*system\s*>", re.IGNORECASE),
    re.compile(r"你现在是", re.IGNORECASE),
    re.compile(r"act as", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"DAN\b", re.IGNORECASE),
]


def sanitize_user_input(text: str) -> str:
    """Escape/neutralize potential prompt injection patterns."""
    for pattern in _INJECTION_PATTERNS:
        text = pattern.sub("[FILTERED]", text)
    # Wrap in a sandbox marker so the model knows it's user content
    return f"[USER_INPUT_START]\n{text}\n[USER_INPUT_END]"


# ── JSON extraction helper ───────────────────────────────────────────────────

def _extract_json(text: str) -> str:
    """Extract JSON from a response that may contain markdown code fences."""
    # Try to find ```json ... ``` block
    m = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    if m:
        return m.group(1).strip()
    # Try to find first { ... } or [ ... ] block
    m = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", text)
    if m:
        return m.group(1).strip()
    return text.strip()


def _mock_workflow_response(user_input: str) -> GenerateWorkflowResponse:
    """Return a deterministic mock workflow for local debugging without API keys."""
    normalized = user_input.strip() or "学习目标"
    include_knowledge = any(k in normalized for k in ("知识库", "资料", "上传", "文档", "笔记", "文件"))
    node_x = 120
    nodes: list[WorkflowNodeSchema] = []
    edges: list[WorkflowEdgeSchema] = []

    def add_node(node_id: str, node_type: str, label: str, y: float = 120) -> None:
        nonlocal node_x
        try:
            node_type_enum = NodeType(node_type)
        except ValueError:
            node_type_enum = NodeType.chat_response
        nodes.append(
            WorkflowNodeSchema(
                id=node_id,
                type=node_type,
                position=NodePosition(x=node_x, y=y),
                data=NodeData(
                    label=label,
                    system_prompt=SYSTEM_PROMPTS.get(node_type_enum, ""),
                    model_route=f"{node_type}/default",
                    status="pending",
                    output="",
                ),
            )
        )
        node_x += 340

    add_node("n-trigger", "trigger_input", f"🎯 目标输入：{normalized}")
    prev_id = "n-trigger"

    if include_knowledge:
        add_node("n-kb", "knowledge_base", "📚 从知识库检索相关资料")
        edges.append(WorkflowEdgeSchema(id="e-trigger-kb", source=prev_id, target="n-kb"))
        prev_id = "n-kb"

    add_node("n-outline", "outline_gen", "🧭 生成学习大纲")
    add_node("n-content", "content_extract", "🧠 提炼核心知识点")
    add_node("n-summary", "summary", "📝 输出学习总结")
    add_node("n-write", "write_db", "💾 保存结果")

    chain = [prev_id, "n-outline", "n-content", "n-summary", "n-write"]
    for idx in range(len(chain) - 1):
        edges.append(
            WorkflowEdgeSchema(
                id=f"e-{chain[idx]}-{chain[idx + 1]}",
                source=chain[idx],
                target=chain[idx + 1],
            )
        )

    implicit_context = ImplicitContext(
        global_theme=normalized,
        language_style="简洁专业",
        core_outline=["理解核心概念", "实践操作", "复盘总结"],
        target_audience="学习者",
        user_constraints={"max_steps": 6, "mode": "mock"},
    )

    return GenerateWorkflowResponse(
        nodes=nodes,
        edges=edges,
        implicit_context=implicit_context,
    )


# ── Retry-validated AI call ──────────────────────────────────────────────────

async def _call_with_retry(node_type: str, messages: list[dict], model_cls, max_retries: int = 3):
    """Call AI and validate output against model_cls, retrying up to max_retries times."""
    last_error: Exception | None = None
    for attempt in range(1, max_retries + 1):
        try:
            raw = await call_llm(node_type, messages, stream=False)
            json_str = _extract_json(raw)
            return model_cls.model_validate_json(json_str)
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            logger.warning("Attempt %d/%d validation failed: %s", attempt, max_retries, e)
            last_error = e
            # Append error feedback for next attempt
            messages = messages + [
                {"role": "assistant", "content": raw if "raw" in dir() else ""},
                {
                    "role": "user",
                    "content": f"输出格式不正确，请重新生成严格的 JSON。错误：{e}",
                },
            ]
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"AI 输出验证失败（已重试 {max_retries} 次）：{last_error}",
    )


# ── Endpoint ─────────────────────────────────────────────────────────────────

@router.post("/generate-workflow", response_model=GenerateWorkflowResponse)
async def generate_workflow(
    body: GenerateWorkflowRequest,
    current_user: dict = Depends(get_current_user),
):
    """Two-stage AI workflow generation.

    Stage 1 — AI_Analyzer: parse user input into structured requirements JSON.
    Stage 2 — AI_Planner: generate nodes[] + edges[] from requirements.
    """
    cfg = get_config()
    max_retries = cfg["engine"]["json_validation_retries"]

    safe_input = sanitize_user_input(body.user_input)

    settings = get_settings()
    mock_ai_enabled = os.getenv("DEV_MOCK_AI", "").lower() in {"1", "true", "yes", "on"}
    is_dev_env = settings.environment.lower() in {"development", "dev", "local"}
    if mock_ai_enabled and is_dev_env:
        logger.info("DEV_MOCK_AI enabled, returning mock workflow for user %s", current_user.get("id"))
        return _mock_workflow_response(body.user_input)

    # ── Stage 1: AI_Analyzer ─────────────────────────────────────────────
    analyzer_messages = [
        {"role": "system", "content": SYSTEM_PROMPTS[NodeType.ai_analyzer]},
        {"role": "user", "content": safe_input},
    ]

    try:
        analyzer_output: AnalyzerOutput = await _call_with_retry(
            "ai_analyzer", analyzer_messages, AnalyzerOutput, max_retries
        )
    except AIRouterError as e:
        raise HTTPException(status_code=503, detail=f"AI 服务暂时不可用：{e}")

    # Build implicit context from analyzer output
    implicit_context = ImplicitContext(
        global_theme=analyzer_output.goal,
        language_style=analyzer_output.extras.get("language_style", "简洁专业"),
        core_outline=analyzer_output.user_defined_steps,
        target_audience=analyzer_output.extras.get("target_audience", "学习者"),
        user_constraints=analyzer_output.constraints,
    )

    # ── Stage 2: AI_Planner ──────────────────────────────────────────────
    planner_messages = [
        {"role": "system", "content": SYSTEM_PROMPTS[NodeType.ai_planner]},
        {
            "role": "user",
            "content": (
                f"需求分析结果：\n{analyzer_output.model_dump_json(indent=2)}\n\n"
                f"暗线上下文：\n{implicit_context.model_dump_json(indent=2)}"
            ),
        },
    ]

    try:
        planner_output: PlannerOutput = await _call_with_retry(
            "ai_planner", planner_messages, PlannerOutput, max_retries
        )
    except AIRouterError as e:
        raise HTTPException(status_code=503, detail=f"AI 服务暂时不可用：{e}")

    # Inject system prompts and model routes into generated nodes
    enriched_nodes: list[WorkflowNodeSchema] = []
    for i, node in enumerate(planner_output.nodes):
        try:
            node_type_enum = NodeType(node.type)
        except ValueError:
            node_type_enum = NodeType.chat_response  # fallback

        enriched_nodes.append(
            WorkflowNodeSchema(
                id=node.id,
                type=node.type,
                position=NodePosition(x=i * 350, y=100),
                data=NodeData(
                    label=node.data.label,
                    system_prompt=SYSTEM_PROMPTS.get(node_type_enum, ""),
                    model_route=node.data.model_route or f"{node_type_enum.value}/default",
                    status="pending",
                    output="",
                ),
            )
        )

    return GenerateWorkflowResponse(
        nodes=enriched_nodes,
        edges=planner_output.edges,
        implicit_context=implicit_context,
    )
