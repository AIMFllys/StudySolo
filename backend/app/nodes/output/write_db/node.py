"""Write DB node — persist workflow results.

Non-LLM node: writes accumulated outputs to the database.
Currently a passthrough; real DB write logic will be added later.
"""

from typing import Any, AsyncIterator

from app.nodes._base import BaseNode, NodeInput


class WriteDBNode(BaseNode):
    node_type = "write_db"
    category = "output"
    description = "将工作流结果持久化到数据库"
    is_llm_node = False
    output_format = "passthrough"
    icon = "💾"
    color = "#6b7280"

    async def execute(
        self,
        node_input: NodeInput,
        llm_caller: Any,
    ) -> AsyncIterator[str]:
        """Persist results to database.

        TODO: implement real DB write logic using Supabase client.
        For now, passes through the upstream output.
        """
        # Collect all upstream outputs as the "result"
        combined = "\n\n".join(
            out for out in node_input.upstream_outputs.values() if out
        )
        if combined:
            yield combined
