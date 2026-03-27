"""Baidu search via Qiniu proxy — uses Qiniu's OpenAI-compatible API
with a model that has built-in web search capability (Qwen3-Max).

Strategy: Use Qiniu's API with enable_search=True to perform
Baidu-backed web searches with authoritative source constraints.
Also parses text results as a fallback when structured metadata is unavailable.
"""

import logging
import os
import re
from dataclasses import dataclass, field

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


@dataclass
class BaiduSearchResult:
    """A single search result from Baidu via Qiniu."""
    title: str
    url: str
    content: str


@dataclass
class BaiduSearchResponse:
    """Aggregated Baidu search response."""
    query: str
    results: list[BaiduSearchResult] = field(default_factory=list)
    summary: str = ""
    error: str | None = None


def _parse_results_from_text(text: str, max_results: int) -> list[BaiduSearchResult]:
    """Parse search results from Qwen's text response."""
    results: list[BaiduSearchResult] = []
    blocks = re.split(r'\n(?=\d+[\.\、])', text)
    for block in blocks:
        block = block.strip()
        if not block or not block[0].isdigit():
            continue
        title_match = re.search(r'\*\*(.+?)\*\*', block)
        title = title_match.group(1) if title_match else block.split('\n')[0][:60]
        url_match = re.search(r'https?://[^\s\)]+', block)
        url = url_match.group(0) if url_match else ""
        content = re.sub(r'\*\*.*?\*\*', '', block).strip()
        content = re.sub(r'https?://[^\s\)]+', '', content).strip()
        content = re.sub(r'^\d+[\.\、]\s*', '', content).strip()

        if title or content:
            results.append(BaiduSearchResult(
                title=title.strip(),
                url=url.strip(),
                content=content[:300],
            ))
        if len(results) >= max_results:
            break
    return results


async def search_via_baidu(
    query: str,
    max_results: int = 5,
) -> BaiduSearchResponse:
    """Execute a web search via Qiniu's Baidu-backed search model.

    Uses the Qiniu OpenAI-compatible API with a search-capable model
    that performs Baidu searches and returns structured results.
    """
    api_key = os.getenv("QINIU_API_KEY", "")
    base_url = os.getenv("QINIU_BASE_URL", "https://api.qnaigc.com/v1")

    if not api_key:
        logger.warning("QINIU_API_KEY not set, Baidu search via Qiniu unavailable")
        return BaiduSearchResponse(
            query=query,
            error="百度搜索未配置（缺少 QINIU_API_KEY）",
        )

    client = AsyncOpenAI(base_url=base_url, api_key=api_key, timeout=30.0)

    search_prompt = (
        f"你是一个学术搜索助手。请搜索以下内容，"
        f"并严格遵循以下搜索规则：\n\n"
        f"## 搜索规则\n"
        f"1. **仅引用权威平台**：百度百科、知网(CNKI)、中国政府网(.gov.cn)、"
        f"学术期刊、官方文档、维基百科\n"
        f"2. **禁止引用**：个人博客、自媒体(百家号、搜狐号)、"
        f"未经验证的论坛帖子、非官方教程网站\n"
        f"3. **每条结果**必须包含：加粗标题、来源URL、核心内容摘要（3-5句话）\n\n"
        f"## 搜索内容\n{query}\n\n"
        f"请用编号列表提供 {max_results} 条最权威、最相关的搜索结果。"
    )

    try:
        response = await client.chat.completions.create(
            model="Qwen/Qwen3-Max",
            messages=[{"role": "user", "content": search_prompt}],
            extra_body={"enable_search": True},
            stream=False,
        )

        content = response.choices[0].message.content or ""
        search_results: list[BaiduSearchResult] = []

        # Method 1: Try structured search_results from response metadata
        raw = response.model_dump() if hasattr(response, "model_dump") else {}
        sr_data = (
            raw.get("search_results")
            or raw.get("choices", [{}])[0].get("search_results")
            or raw.get("choices", [{}])[0].get("message", {}).get("search_results")
        )
        if isinstance(sr_data, list):
            for item in sr_data[:max_results]:
                if isinstance(item, dict):
                    search_results.append(BaiduSearchResult(
                        title=item.get("title", ""),
                        url=item.get("url", item.get("link", "")),
                        content=item.get("content", item.get("snippet", "")),
                    ))

        # Method 2: Parse from text if no structured results
        if not search_results and content:
            search_results = _parse_results_from_text(content, max_results)

        return BaiduSearchResponse(
            query=query,
            results=search_results,
            summary=content,
        )

    except Exception as e:
        logger.error("Baidu search via Qiniu failed for query '%s': %s", query[:50], e)
        return BaiduSearchResponse(query=query, error=f"百度搜索出错: {e}")
