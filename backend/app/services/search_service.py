"""Web search service — wraps Tavily API for real-time web search.

Tavily is a search API designed for AI agents. It returns clean,
structured results with relevant content extracted from web pages.

Fallback: If Tavily is unavailable, the service can degrade gracefully
by returning an empty result set with a warning message.
"""

import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

TAVILY_API_URL = "https://api.tavily.com/search"


@dataclass
class SearchResult:
    """A single search result."""
    title: str
    url: str
    content: str
    score: float = 0.0


@dataclass
class SearchResponse:
    """Aggregated search response."""
    query: str
    results: list[SearchResult] = field(default_factory=list)
    answer: Optional[str] = None  # Tavily can provide a direct answer
    error: Optional[str] = None


async def search_web(
    query: str,
    max_results: int = 5,
    search_depth: str = "basic",
    include_answer: bool = True,
    topic: str = "general",
) -> SearchResponse:
    """Execute a web search via Tavily API.

    Args:
        query: Search query string
        max_results: Maximum number of results (1-10)
        search_depth: "basic" or "advanced" (advanced costs more)
        include_answer: Whether to request an AI-generated answer
        topic: "general" or "news"

    Returns:
        SearchResponse with results and optional answer
    """
    api_key = os.getenv("TAVILY_API_KEY", "")
    if not api_key:
        logger.warning("TAVILY_API_KEY not set, web search unavailable")
        return SearchResponse(
            query=query,
            error="联网搜索未配置（缺少 TAVILY_API_KEY）",
        )

    payload = {
        "api_key": api_key,
        "query": query,
        "max_results": min(max_results, 10),
        "search_depth": search_depth,
        "include_answer": include_answer,
        "topic": topic,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(TAVILY_API_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for item in data.get("results", []):
            results.append(SearchResult(
                title=item.get("title", ""),
                url=item.get("url", ""),
                content=item.get("content", ""),
                score=item.get("score", 0.0),
            ))

        return SearchResponse(
            query=query,
            results=results,
            answer=data.get("answer"),
        )

    except httpx.TimeoutException:
        logger.error("Tavily API timeout for query: %s", query)
        return SearchResponse(query=query, error="搜索请求超时，请稍后重试")

    except httpx.HTTPStatusError as e:
        logger.error("Tavily API HTTP error: %s", e)
        return SearchResponse(query=query, error=f"搜索服务返回错误: {e.response.status_code}")

    except Exception as e:
        logger.error("Web search failed: %s", e)
        return SearchResponse(query=query, error=f"搜索出错: {e}")


def format_search_results(response: SearchResponse) -> str:
    """Format search results as Markdown for downstream nodes.

    Output format:
    ## 🔍 搜索结果: {query}

    > AI 摘要: {answer}

    ### 1. {title}
    > 来源: {url}
    {content}

    ---
    """
    lines: list[str] = []

    if response.error:
        return f"⚠️ {response.error}"

    lines.append(f"## 🔍 搜索结果: {response.query}\n")

    if response.answer:
        lines.append(f"> **AI 摘要**: {response.answer}\n")

    if not response.results:
        lines.append("未找到相关结果。")
        return "\n".join(lines)

    for i, result in enumerate(response.results, 1):
        lines.append(f"### {i}. {result.title}")
        lines.append(f"> 来源: [{result.url}]({result.url})")
        lines.append(f"\n{result.content}\n")
        lines.append("---\n")

    lines.append(f"*共 {len(response.results)} 条结果*")

    return "\n".join(lines)
