from types import SimpleNamespace

import pytest

from app.api.ai.chat import _agent_loop_enabled
from app.models.ai_catalog import CatalogSku
from app.models.ai_chat import AIChatRequest, CanvasContextSchema
from app.services.ai_chat.agent_loop import _get_token_iter, _strip_reasoning_blocks
from app.services.ai_chat.thinking import (
    resolve_effective_thinking_level,
    should_force_reasoning_model,
)
from app.services.ai_chat.tools import iter_tool_specs
from app.services.llm.caller import LLMStreamResult, stream_tokens


def _sku(sku_id: str, *, supports_thinking: bool) -> CatalogSku:
    return CatalogSku(
        sku_id=sku_id,
        family_id=f"family-{sku_id}",
        family_name=f"Family {sku_id}",
        provider="test-provider",
        vendor="test-vendor",
        model_id=f"model-{sku_id}",
        display_name=f"Model {sku_id}",
        billing_channel="native",
        task_family="chat_response",
        routing_policy="native_first",
        supports_thinking=supports_thinking,
    )


def test_ai_chat_request_defaults_to_fast_thinking():
    assert AIChatRequest(user_input="你好").thinking_level == "fast"


def test_agent_loop_disabled_for_plain_chat_without_canvas(monkeypatch):
    monkeypatch.delenv("AGENT_LOOP_DISABLED", raising=False)
    body = AIChatRequest(user_input="你好，解释一下费曼学习法", mode="chat")

    assert _agent_loop_enabled(body) is False


def test_agent_loop_enabled_for_tool_contexts(monkeypatch):
    monkeypatch.delenv("AGENT_LOOP_DISABLED", raising=False)

    assert _agent_loop_enabled(AIChatRequest(user_input="帮我规划", mode="plan")) is True
    assert _agent_loop_enabled(AIChatRequest(user_input="新增两个节点", mode="create")) is True
    assert _agent_loop_enabled(
        AIChatRequest(
            user_input="你好",
            mode="chat",
            canvas_context=CanvasContextSchema(workflow_id="wf-1"),
        )
    ) is True
    assert _agent_loop_enabled(AIChatRequest(user_input="列出我的工作流", mode="chat")) is True


def test_agent_loop_respects_global_and_intent_opt_out(monkeypatch):
    monkeypatch.setenv("AGENT_LOOP_DISABLED", "1")
    assert _agent_loop_enabled(AIChatRequest(user_input="列出我的工作流", mode="chat")) is False

    monkeypatch.delenv("AGENT_LOOP_DISABLED", raising=False)
    assert _agent_loop_enabled(
        AIChatRequest(user_input="列出我的工作流", mode="chat", intent_hint="LEGACY")
    ) is False


def test_strip_reasoning_blocks_preserves_agent_xml():
    raw = (
        "<think>hidden</think>"
        "<answer>ok</answer>"
        "<thinking>more hidden</thinking>"
        "<tool_use name=\"read_canvas\"><params>{}</params></tool_use>"
        "<reasoning>also hidden</reasoning>"
        "<summary><change>改了节点</change></summary>"
    )

    cleaned = _strip_reasoning_blocks(raw)

    assert "hidden" not in cleaned
    assert "<answer>ok</answer>" in cleaned
    assert "<tool_use name=\"read_canvas\">" in cleaned
    assert "<summary><change>改了节点</change></summary>" in cleaned


def test_agent_tool_registry_contains_expected_tools():
    names = {spec.name for spec in iter_tool_specs()}

    assert names == {
        "list_workflows",
        "open_workflow",
        "rename_workflow",
        "batch_rename_workflows",
        "start_workflow_background",
        "get_workflow_run_status",
        "read_canvas",
        "add_node",
        "update_node",
        "delete_node",
        "add_edge",
        "delete_edge",
    }


def test_effective_thinking_level_respects_selected_sku_capability():
    thinking_sku = _sku("thinking", supports_thinking=True)
    non_thinking_sku = _sku("fast", supports_thinking=False)

    assert resolve_effective_thinking_level("deep", None) == "deep"
    assert should_force_reasoning_model(None, "deep") is True
    assert resolve_effective_thinking_level("deep", thinking_sku) == "deep"
    assert should_force_reasoning_model(thinking_sku, "deep") is False
    assert resolve_effective_thinking_level("deep", non_thinking_sku) == "balanced"
    assert resolve_effective_thinking_level("balanced", non_thinking_sku) == "balanced"
    assert resolve_effective_thinking_level("fast", non_thinking_sku) == "fast"


@pytest.mark.asyncio
async def test_get_token_iter_only_forces_r1_without_selected_sku(monkeypatch):
    calls: list[tuple[str, str]] = []

    async def fake_direct(provider, model_id, _messages, *, stream):
        calls.append((provider, model_id))

        async def gen():
            yield "ok"

        return gen()

    async def fake_lightweight(_messages, *, stream):
        calls.append(("lightweight", "chat_response"))

        async def gen():
            yield "ok"

        return gen()

    monkeypatch.setattr("app.services.ai_chat.agent_loop.call_llm_direct", fake_direct)
    monkeypatch.setattr(
        "app.services.ai_chat.agent_loop.call_lightweight_chat_response",
        fake_lightweight,
    )

    tokens = [token async for token in await _get_token_iter(None, [], "deep")]
    assert tokens == ["ok"]
    assert calls[-1] == ("deepseek", "deepseek-reasoner")

    selected = _sku("manual", supports_thinking=False)
    tokens = [token async for token in await _get_token_iter(selected, [], "balanced")]
    assert tokens == ["ok"]
    assert calls[-1] == ("test-provider", "model-manual")

    tokens = [token async for token in await _get_token_iter(None, [], "fast")]
    assert tokens == ["ok"]
    assert calls[-1] == ("lightweight", "chat_response")


@pytest.mark.asyncio
async def test_stream_tokens_yields_reasoning_but_keeps_result_content_clean():
    async def fake_stream():
        yield SimpleNamespace(
            id="req-1",
            model="fake-model",
            choices=[SimpleNamespace(delta=SimpleNamespace(reasoning_content="hidden"))],
        )
        yield SimpleNamespace(
            id="req-1",
            model="fake-model",
            choices=[SimpleNamespace(delta=SimpleNamespace(content="<answer>visible</answer>"))],
        )

    class FakeCompletions:
        async def create(self, **_kwargs):
            return fake_stream()

    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=FakeCompletions()))
    result = LLMStreamResult()

    tokens = [
        token
        async for token in stream_tokens(
            fake_client,
            "fake-model",
            [{"role": "user", "content": "hi"}],
            result,
        )
    ]

    assert tokens == ["<think>", "hidden", "</think>", "<answer>visible</answer>"]
    assert result.content == "<answer>visible</answer>"
