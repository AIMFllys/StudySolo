"""Thinking-depth helpers shared by AI chat streaming paths."""

from __future__ import annotations

from typing import Literal

from app.models.ai_catalog import CatalogSku

ThinkingLevel = Literal["fast", "balanced", "deep"]


def resolve_effective_thinking_level(
    requested: ThinkingLevel,
    selected_sku: CatalogSku | None,
) -> ThinkingLevel:
    """Return the depth that should be sent to prompts/routing.

    Explicit model selection stays authoritative. Non-thinking selected models
    should not receive deep reasoning prompts and should never trigger the
    automatic R1 fallback.
    """
    if selected_sku and not selected_sku.supports_thinking and requested == "deep":
        return "balanced"
    return requested


def should_force_reasoning_model(
    selected_sku: CatalogSku | None,
    effective_thinking_level: ThinkingLevel,
) -> bool:
    """Only no-SKU deep requests may force the default reasoning model."""
    return selected_sku is None and effective_thinking_level == "deep"
