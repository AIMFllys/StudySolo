"""Prompt Loader — 从 .md 文件加载并组装 System Prompt.

行业标准参考:
- Microsoft Semantic Kernel: skprompt.txt + config.json
- LangChain: PromptTemplate + .txt/.md files
- Anthropic: Markdown-based prompt library

设计原则:
1. 每个 prompt 一个 .md 文件 (可读、可编辑、Git 友好)
2. 变量用 {{var}} 占位 (不与 Markdown 语法冲突)
3. 加载后缓存 (进程级, 避免重复 IO)
4. identity.md 自动注入到所有中间 prompt 前面
"""

from __future__ import annotations

import re
from functools import lru_cache
from pathlib import Path

# ── Constants ────────────────────────────────────────────────────

_PROMPTS_DIR = Path(__file__).parent
_VAR_PATTERN = re.compile(r"\{\{(\w+)\}\}")

# 思考深度 → 人类可读指令
DEPTH_LABELS: dict[str, str] = {
    "fast": "快速模式: 请简洁直接，不展开细节。",
    "balanced": "均衡模式: 请给出完整但有条理的回答。",
    "deep": "深度模式: 请从多角度深入分析，给出专业级回答。",
}


# ── Core Loader ──────────────────────────────────────────────────

@lru_cache(maxsize=32)
def _load_md(name: str) -> str:
    """Read a .md file from the prompts directory. Cached per process."""
    path = _PROMPTS_DIR / f"{name}.md"
    if not path.exists():
        raise FileNotFoundError(f"Prompt file not found: {path}")
    return path.read_text(encoding="utf-8")


def _render(template: str, **variables: str) -> str:
    """Replace {{var}} placeholders with provided values."""
    def replacer(match: re.Match) -> str:
        key = match.group(1)
        return variables.get(key, match.group(0))  # 未提供的变量保留原样
    return _VAR_PATTERN.sub(replacer, template)


def load_prompt(name: str, **variables: str) -> str:
    """Load a prompt .md and render variables.

    Args:
        name: Filename without .md extension (e.g. 'mode_plan')
        **variables: Key-value pairs to substitute {{key}} placeholders

    Returns:
        Rendered prompt string
    """
    template = _load_md(name)
    return _render(template, **variables)


# ── High-level Assemblers ────────────────────────────────────────

def get_plan_prompt(canvas_context: str, thinking_depth: str = "balanced") -> str:
    """Assemble Plan mode system prompt: identity + mode_plan."""
    identity = load_prompt("identity")
    plan = load_prompt(
        "mode_plan",
        canvas_context=canvas_context,
        thinking_depth=DEPTH_LABELS.get(thinking_depth, DEPTH_LABELS["balanced"]),
    )
    return f"{identity}\n\n{plan}"


def get_chat_prompt(canvas_context: str) -> str:
    """Assemble Chat mode system prompt: identity + mode_chat."""
    identity = load_prompt("identity")
    chat = load_prompt("mode_chat", canvas_context=canvas_context)
    return f"{identity}\n\n{chat}"


def get_create_prompt(canvas_context: str, thinking_depth: str = "balanced") -> str:
    """Assemble Create mode system prompt: identity + mode_create."""
    identity = load_prompt("identity")
    create = load_prompt(
        "mode_create",
        canvas_context=canvas_context,
        thinking_depth=DEPTH_LABELS.get(thinking_depth, DEPTH_LABELS["balanced"]),
    )
    return f"{identity}\n\n{create}"


def get_intent_prompt(canvas_context: str) -> str:
    """Assemble intent classifier prompt: identity + intent_classifier."""
    identity = load_prompt("identity")
    classifier = load_prompt("intent_classifier", canvas_context=canvas_context)
    return f"{identity}\n\n{classifier}"


# ── Backward Compat (旧接口, 逐步废弃) ───────────────────────────

def get_intent_system_prompt(canvas_context_str: str) -> str:
    """Legacy: 映射到新 get_intent_prompt."""
    return get_intent_prompt(canvas_context_str)


def get_modify_system_prompt(canvas_context_str: str) -> str:
    """Legacy: 映射到新 get_create_prompt (MODIFY → Create)."""
    return get_create_prompt(canvas_context_str)


def get_chat_system_prompt(canvas_context_str: str) -> str:
    """Legacy: 映射到新 get_chat_prompt."""
    return get_chat_prompt(canvas_context_str)
