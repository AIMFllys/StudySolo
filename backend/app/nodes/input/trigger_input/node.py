"""Trigger input node — workflow entry point.

Non-LLM node: simply passes the user's initial input downstream.
"""

from typing import Any, AsyncIterator

from app.nodes._base import BaseNode, NodeInput


class TriggerInputNode(BaseNode):
    node_type = "trigger_input"
    category = "input"
    description = "工作流触发入口，接收用户初始输入"
    is_llm_node = False
    output_format = "passthrough"
    icon = "▶️"
    color = "#10b981"

    async def execute(
        self,
        node_input: NodeInput,
        llm_caller: Any,
    ) -> AsyncIterator[str]:
        """Pass through user content as-is — no LLM call needed."""
        output = node_input.user_content or ""
        if output:
            yield output
