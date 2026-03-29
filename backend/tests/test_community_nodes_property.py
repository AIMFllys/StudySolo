from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.engine import executor
from app.nodes.community.node import CommunityNode
from app.services.community_node_service import _serialize_mine, _serialize_public


def _sample_row() -> dict:
    return {
        "id": "node-1",
        "author_id": "user-1",
        "name": "结构化总结器",
        "description": "输出结构化总结",
        "icon": "Bot",
        "category": "analysis",
        "version": "1.0.0",
        "input_hint": "输入原文",
        "output_format": "json",
        "output_schema": {"type": "object"},
        "model_preference": "auto",
        "knowledge_file_name": "guide.md",
        "knowledge_file_size": 128,
        "likes_count": 3,
        "install_count": 0,
        "created_at": datetime.now(timezone.utc),
        "prompt": "secret prompt",
        "status": "approved",
        "reject_reason": None,
        "knowledge_file_path": "user-1/guide.md",
        "knowledge_text": "secret knowledge",
        "is_public": True,
    }


def test_public_serializer_does_not_expose_prompt_or_knowledge():
    payload = _serialize_public(
        _sample_row(),
        author_name="作者",
        is_liked=True,
        is_owner=False,
    ).model_dump()

    assert payload["name"] == "结构化总结器"
    assert payload["is_liked"] is True
    assert "prompt" not in payload
    assert "knowledge_text" not in payload
    assert "knowledge_file_path" not in payload


def test_mine_serializer_keeps_prompt_for_author():
    payload = _serialize_mine(_sample_row(), author_name="我", is_liked=False).model_dump()

    assert payload["prompt"] == "secret prompt"
    assert payload["status"] == "approved"


def test_build_runtime_config_merges_root_execution_fields():
    runtime_config = executor._build_runtime_config(
        {
            "config": {"temperature": 0.2, "model_route": "old-model"},
            "model_route": "sku-123",
            "community_node_id": "community-1",
            "output_format": "json",
            "input_hint": "请输入正文",
            "model_preference": "fast",
            "community_icon": "Sparkles",
        }
    )

    assert runtime_config == {
        "temperature": 0.2,
        "model_route": "sku-123",
        "community_node_id": "community-1",
        "output_format": "json",
        "input_hint": "请输入正文",
        "model_preference": "fast",
        "community_icon": "Sparkles",
    }


@pytest.mark.asyncio
async def test_build_node_llm_caller_prefers_direct_sku(monkeypatch):
    captured: dict[str, object] = {}

    async def fake_get_sku_by_id(sku_id: str):
        assert sku_id == "sku-123"
        return SimpleNamespace(provider="dashscope", model_id="qwen-plus")

    async def fake_call_llm_direct(provider: str, model_id: str, messages: list[dict], *, stream: bool):
        captured["provider"] = provider
        captured["model_id"] = model_id
        captured["messages"] = messages
        captured["stream"] = stream
        return "direct-result"

    async def fake_call_llm(*args, **kwargs):  # pragma: no cover - should not be called
        raise AssertionError("fallback router should not be used when sku exists")

    monkeypatch.setattr("app.engine.node_runner.get_sku_by_id", fake_get_sku_by_id)
    monkeypatch.setattr("app.engine.node_runner.call_llm_direct", fake_call_llm_direct)
    monkeypatch.setattr("app.engine.node_runner.call_llm", fake_call_llm)

    caller = executor._build_node_llm_caller({"model_route": "sku-123"})
    result = await caller("summary", [{"role": "user", "content": "hello"}], stream=True)

    assert result == "direct-result"
    assert captured == {
        "provider": "dashscope",
        "model_id": "qwen-plus",
        "messages": [{"role": "user", "content": "hello"}],
        "stream": True,
    }


@pytest.mark.asyncio
async def test_build_node_llm_caller_falls_back_to_task_route(monkeypatch):
    async def fake_get_sku_by_id(_sku_id: str):
        return None

    async def fake_call_llm_direct(*args, **kwargs):  # pragma: no cover - should not be called
        raise AssertionError("direct router should not be used when sku is missing")

    async def fake_call_llm(node_type: str, messages: list[dict], *, stream: bool):
        return {
            "node_type": node_type,
            "messages": messages,
            "stream": stream,
        }

    monkeypatch.setattr("app.engine.node_runner.get_sku_by_id", fake_get_sku_by_id)
    monkeypatch.setattr("app.engine.node_runner.call_llm_direct", fake_call_llm_direct)
    monkeypatch.setattr("app.engine.node_runner.call_llm", fake_call_llm)

    caller = executor._build_node_llm_caller({"model_route": "missing-sku"})
    result = await caller("chat_response", [{"role": "user", "content": "hi"}], stream=False)

    assert result == {
        "node_type": "chat_response",
        "messages": [{"role": "user", "content": "hi"}],
        "stream": False,
    }


@pytest.mark.asyncio
async def test_community_node_post_process_returns_json_when_valid():
    node = CommunityNode()
    node._output_format = "json"

    result = await node.post_process('```json\n{"title":"社区节点"}\n```')

    assert result.format == "json"
    assert result.metadata["json_valid"] is True
    assert '"title": "社区节点"' in result.content


@pytest.mark.asyncio
async def test_community_node_post_process_falls_back_for_invalid_json():
    node = CommunityNode()
    node._output_format = "json"

    result = await node.post_process("```json\n{\"title\": }\n```")

    assert result.format == "markdown"
    assert result.metadata["json_valid"] is False
    assert "JSON 格式校验失败" in result.content
