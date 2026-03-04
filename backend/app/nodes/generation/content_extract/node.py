"""Content extraction node — distills core knowledge points."""

from typing import Any, AsyncIterator
from app.nodes._base import BaseNode, NodeInput
from app.nodes._mixins import LLMStreamMixin


class ContentExtractNode(BaseNode, LLMStreamMixin):
    node_type = "content_extract"
    category = "generation"
    description = "根据大纲提炼核心知识点"
    is_llm_node = True
    output_format = "markdown"
    icon = "🔬"
    color = "#3b82f6"

    async def execute(self, node_input: NodeInput, llm_caller: Any) -> AsyncIterator[str]:
        system = self.system_prompt + self.build_context_prompt(node_input.implicit_context)
        user_msg = self.build_user_message(node_input)
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ]
        async for token in self.stream_llm(messages, llm_caller):
            yield token
