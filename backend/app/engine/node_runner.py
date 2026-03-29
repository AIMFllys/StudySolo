"""Single-node execution: input building, LLM caller construction, and timeout wrapper."""

import asyncio
import json
import logging
from typing import Any

from app.nodes import NODE_REGISTRY
from app.nodes._base import NodeInput
from app.services.ai_catalog_service import get_sku_by_id
from app.services.ai_router import call_llm, call_llm_direct
from app.services.usage_ledger import bind_usage_call

logger = logging.getLogger(__name__)

DEFAULT_NODE_TIMEOUT = 120


def build_input_snapshot(node_input: NodeInput) -> str:
    """Safely serialize the combined node input into a JSON string."""
    snapshot = {
        "user_content": node_input.user_content,
        "upstream_outputs": node_input.upstream_outputs,
        "node_config": node_input.node_config,
    }
    return json.dumps(snapshot, ensure_ascii=False)


def resolve_user_content(node_data: dict) -> str:
    """Resolve effective user content with config fallback for input nodes."""
    config = node_data.get("config")
    if isinstance(config, dict):
        template = config.get("input_template")
        if isinstance(template, str) and template.strip():
            return node_data.get("user_content") or template
    return node_data.get("user_content") or node_data.get("label", "")


def build_runtime_config(node_data: dict) -> dict[str, Any] | None:
    """Merge node.data root execution fields into node_config."""
    merged: dict[str, Any] = {}
    config = node_data.get("config")
    if isinstance(config, dict):
        merged.update(config)

    for key in (
        "model_route", "community_node_id", "output_format",
        "input_hint", "model_preference", "community_icon",
    ):
        value = node_data.get(key)
        if value not in (None, ""):
            merged[key] = value

    return merged or None


def build_node_llm_caller(runtime_config: dict[str, Any] | None):
    """Create an LLM caller closure that respects the node's model_route."""
    async def _llm_caller(node_type: str, messages: list[dict], stream: bool = False):
        model_route = runtime_config.get("model_route") if runtime_config else None
        if isinstance(model_route, str) and model_route:
            sku = await get_sku_by_id(model_route)
            if sku:
                return await call_llm_direct(sku.provider, sku.model_id, messages, stream=stream)
        return await call_llm(node_type, messages, stream=stream)
    return _llm_caller


async def execute_single_node(
    node_id: str,
    node_config: dict,
    upstream_outputs: dict[str, str],
    implicit_context: dict | None,
) -> tuple[str, str | None, str | None]:
    """Execute a single node and return (node_id, output, error)."""
    node_type_str = node_config.get("type", "chat_response")
    node_data = node_config.get("data", {})

    NodeClass = NODE_REGISTRY.get(node_type_str)
    if not NodeClass:
        NodeClass = NODE_REGISTRY.get("chat_response")
        if not NodeClass:
            return (node_id, None, f"Unknown node type: {node_type_str}")

    node_instance = NodeClass()
    runtime_config = build_runtime_config(node_data)

    node_input = NodeInput(
        user_content=resolve_user_content(node_data),
        upstream_outputs=upstream_outputs,
        implicit_context=implicit_context,
        node_config=runtime_config,
    )

    full_output = ""
    try:
        with bind_usage_call(node_id=node_id, node_type=node_type_str):
            async for token in node_instance.execute(
                node_input, build_node_llm_caller(runtime_config),
            ):
                full_output += token
        result = await node_instance.post_process(full_output)
        return (node_id, result.content, None)
    except Exception as e:
        logger.error("Node %s execution failed: %s", node_id, e)
        return (node_id, None, str(e))


async def execute_single_node_with_timeout(
    node_id: str,
    node_config: dict,
    upstream_outputs: dict[str, str],
    implicit_context: dict | None,
    timeout_seconds: int = DEFAULT_NODE_TIMEOUT,
) -> tuple[str, str | None, str | None]:
    """Wrapper that applies per-node timeout."""
    try:
        return await asyncio.wait_for(
            execute_single_node(
                node_id=node_id, node_config=node_config,
                upstream_outputs=upstream_outputs, implicit_context=implicit_context,
            ),
            timeout=timeout_seconds,
        )
    except asyncio.TimeoutError:
        logger.error("Node %s timed out after %ds", node_id, timeout_seconds)
        return (node_id, None, f"节点执行超时（{timeout_seconds}秒）")
