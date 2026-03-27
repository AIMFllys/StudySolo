"""GLM web_search provider — uses Zhipu AI's web_search tool capability.

GLM models (GLM-4 series) support a `web_search` tool that performs
real-time internet searches and returns structured results.

Strategy: call GLM chat API with web_search tool enabled,
extract both the text summary and structured search references.
"""

import json
import logging
import os
import re
from dataclasses import dataclass, field

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


@dataclass
class GLMSearchResult:
    """A single search result from GLM web_search."""
    title: str
    url: str
    content: str
    refer: str = ""


@dataclass
class GLMSearchResponse:
    """Aggregated GLM search response."""
    query: str
    results: list[GLMSearchResult] = field(default_factory=list)
    summary: str = ""
    error: str | None = None


def _parse_results_from_text(text: str, max_results: int) -> list[GLMSearchResult]:
    """Parse search results from GLM's text response when structured metadata is unavailable.

    GLM often returns results in numbered format like:
    1. **Title** - Content... (URL: https://...)
    """
    results: list[GLMSearchResult] = []
    # Pattern: numbered items with potential URLs
    blocks = re.split(r'\n(?=\d+[\.\、])', text)
    for block in blocks:
        block = block.strip()
        if not block or not block[0].isdigit():
            continue
        # Extract title (bold or first line)
        title_match = re.search(r'\*\*(.+?)\*\*', block)
        title = title_match.group(1) if title_match else block.split('\n')[0][:60]
        # Extract URL
        url_match = re.search(r'https?://[^\s\)]+', block)
        url = url_match.group(0) if url_match else ""
        # Content is the rest
        content = re.sub(r'\*\*.*?\*\*', '', block).strip()
        content = re.sub(r'https?://[^\s\)]+', '', content).strip()
        content = re.sub(r'^\d+[\.\、]\s*', '', content).strip()

        if title or content:
            results.append(GLMSearchResult(
                title=title.strip(),
                url=url.strip(),
                content=content[:300],
            ))
        if len(results) >= max_results:
            break
    return results


async def search_via_glm(
    query: str,
    max_results: int = 5,
) -> GLMSearchResponse:
    """Execute a web search via GLM's web_search tool.

    Uses the Zhipu AI API with web_search tool enabled.
    The model performs the search and we extract results from the response.
    """
    api_key = os.getenv("ZHIPU_API_KEY", "")
    base_url = os.getenv("ZHIPU_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")

    if not api_key:
        logger.warning("ZHIPU_API_KEY not set, GLM search unavailable")
        return GLMSearchResponse(
            query=query,
            error="GLM 搜索未配置（缺少 ZHIPU_API_KEY）",
        )

    client = AsyncOpenAI(base_url=base_url, api_key=api_key, timeout=30.0)

    search_prompt = (
        f"请搜索以下内容，优先从权威平台获取信息"
        f"（如百度百科、知网CNKI、中国政府网、学术期刊、官方文档）。\n"
        f"禁止引用非官方自媒体、个人博客等不可靠来源。\n\n"
        f"搜索内容：{query}\n\n"
        f"请提供 {max_results} 条最相关的搜索结果，"
        f"每条用编号列出，包含：加粗标题、来源URL、核心内容摘要（3-5句话）。"
    )

    try:
        response = await client.chat.completions.create(
            model="glm-4-flash",
            messages=[{"role": "user", "content": search_prompt}],
            tools=[{"type": "web_search", "web_search": {"enable": True}}],
            stream=False,
        )

        content = response.choices[0].message.content or ""
        web_results: list[GLMSearchResult] = []

        # Method 1: Try extracting structured web_search metadata
        # GLM may return this at various nesting levels
        raw = response.model_dump() if hasattr(response, "model_dump") else {}
        ws_data = (
            raw.get("web_search")
            or raw.get("choices", [{}])[0].get("web_search")
            or raw.get("choices", [{}])[0].get("message", {}).get("web_search")
        )
        if isinstance(ws_data, list):
            for item in ws_data[:max_results]:
                if isinstance(item, dict):
                    web_results.append(GLMSearchResult(
                        title=item.get("title", ""),
                        url=item.get("link", item.get("url", "")),
                        content=item.get("content", ""),
                        refer=item.get("refer", ""),
                    ))

        # Method 2: Parse from text content if no structured results
        if not web_results and content:
            web_results = _parse_results_from_text(content, max_results)

        return GLMSearchResponse(
            query=query,
            results=web_results,
            summary=content,
        )

    except Exception as e:
        logger.error("GLM web search failed for query '%s': %s", query[:50], e)
        return GLMSearchResponse(query=query, error=f"GLM 搜索出错: {e}")
