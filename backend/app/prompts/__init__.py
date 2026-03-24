"""AI Prompts Package — Markdown-based prompt system.

All prompts are stored as individual .md files in this directory.
Use prompt_loader.py to load and assemble them.

Public API:
    get_plan_prompt(canvas_ctx, depth)   → Plan mode system prompt
    get_chat_prompt(canvas_ctx)          → Chat mode system prompt
    get_create_prompt(canvas_ctx, depth) → Create mode system prompt
    get_intent_prompt(canvas_ctx)        → Intent classifier prompt
    load_prompt(name, **vars)            → Load any .md prompt with variables
"""

from app.prompts.prompt_loader import (  # noqa: F401
    # ── New API (v2) ──
    get_plan_prompt,
    get_chat_prompt,
    get_create_prompt,
    get_intent_prompt,
    load_prompt,
    DEPTH_LABELS,
    # ── Legacy compat (v1, will be deprecated) ──
    get_intent_system_prompt,
    get_modify_system_prompt,
    get_chat_system_prompt,
)
