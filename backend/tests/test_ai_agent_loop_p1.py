from types import SimpleNamespace

import pytest

from app.api.ai.chat import _agent_loop_enabled
from app.models.ai_chat import AIChatRequest, CanvasContextSchema
from app.services.ai_chat.agent_loop import _strip_reasoning_blocks
from app.services.llm.caller import LLMStreamResult, stream_tokens


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
