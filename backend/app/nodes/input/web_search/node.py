"""WebSearch node — retrieves real-time information from the internet.

This is a NON-LLM node. It calls Tavily search API instead of an LLM.
The search results are formatted as Markdown and passed to downstream nodes.

Typical flows:
  [trigger_input] → [web_search] → [content_extract] → [summary]
  [trigger_input] → [web_search] → [flashcard]
"""

import logging
from typing import Any, AsyncIterator

from app.nodes._base import BaseNode, NodeInput, NodeOutput

logger = logging.getLogger(__name__)


class WebSearchNode(BaseNode):
    node_type = "web_search"
    category = "input"
    description = "联网搜索获取最新信息"
    is_llm_node = False
    output_format = "markdown"
    icon = "🌐"
    color = "#0ea5e9"

    async def execute(self, node_input: NodeInput, llm_caller: Any) -> AsyncIterator[str]:
        """Execute web search.

        Query is built from:
        1. node_input.user_content (the label)
        2. Upstream outputs (first 200 chars for context)
        """
        # Lazy import to avoid registration-time dependency
        from app.services.search_service import search_web, format_search_results

        # Build search query
        # Strategy: label is the primary search term.
        # Upstream outputs only contribute a short keyword hint (first line/title),
        # NOT the raw 200-char dump which pollutes search recall.
        query_parts: list[str] = []
        if node_input.user_content:
            # Strip common emoji prefixes from planner labels
            label = node_input.user_content.strip()
            for prefix in ("🌐", "🔍", "📖"):
                label = label.removeprefix(prefix).strip()
            query_parts.append(label)

        if node_input.upstream_outputs:
            for uid, out in node_input.upstream_outputs.items():
                # Extract only the first meaningful line as keyword context
                first_line = ""
                for line in out.split("\n"):
                    stripped = line.strip().lstrip("#").strip()
                    if stripped and len(stripped) > 3:
                        first_line = stripped[:80]
                        break
                if first_line:
                    query_parts.append(first_line)

        query = " ".join(query_parts)
        if not query.strip():
            yield "⚠️ 没有提供搜索关键词"
            return

        # Get search config
        max_results = 5
        search_depth = "basic"
        if node_input.node_config:
            max_results = node_input.node_config.get("max_results", 5)
            search_depth = node_input.node_config.get("search_depth", "basic")

        # Perform search
        try:
            yield "🔍 正在搜索...\n\n"

            response = await search_web(
                query=query,
                max_results=max_results,
                search_depth=search_depth,
            )

            formatted = format_search_results(response)
            yield formatted

        except Exception as e:
            logger.error("Web search node failed: %s", e)
            yield f"⚠️ 联网搜索出错: {e}"

    async def post_process(self, raw_output: str) -> NodeOutput:
        """Return search results as markdown."""
        # Remove the "searching..." prefix if present
        content = raw_output
        if content.startswith("🔍 正在搜索..."):
            content = content[len("🔍 正在搜索...\n\n"):]

        return NodeOutput(
            content=content,
            format="markdown",
            metadata={"source": "web_search"},
        )
