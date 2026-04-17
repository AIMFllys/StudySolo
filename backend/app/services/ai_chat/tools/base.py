"""Base types and registry for agent tools."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable

from pydantic import BaseModel, Field
from supabase import AsyncClient


# ── Result shapes ───────────────────────────────────────────────────────

class CanvasMutation(BaseModel):
    """Tool-produced canvas update that the frontend should apply in-memory."""
    workflow_id: str
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)


class UIEffect(BaseModel):
    """Frontend side-effect: currently only navigation."""
    type: str
    url: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ToolResult(BaseModel):
    ok: bool
    data: Any = None
    error: str | None = None
    canvas_mutation: CanvasMutation | None = None
    ui_effect: UIEffect | None = None

    def to_llm_payload(self) -> dict[str, Any]:
        """Compact JSON to feed back to the LLM as <tool_result>."""
        if not self.ok:
            return {"ok": False, "error": self.error}
        body: dict[str, Any] = {"ok": True}
        if self.data is not None:
            body["data"] = self.data
        if self.ui_effect is not None:
            body["ui_effect"] = {"type": self.ui_effect.type, "url": self.ui_effect.url}
        if self.canvas_mutation is not None:
            body["canvas"] = {
                "workflow_id": self.canvas_mutation.workflow_id,
                "node_count": len(self.canvas_mutation.nodes),
                "edge_count": len(self.canvas_mutation.edges),
                "nodes": [
                    {
                        "id": n.get("id"),
                        "type": n.get("type"),
                        "label": (n.get("data") or {}).get("label"),
                    }
                    for n in self.canvas_mutation.nodes
                ],
            }
        return body


# ── Execution context ───────────────────────────────────────────────────

@dataclass
class ToolContext:
    user: dict
    db: AsyncClient
    service_db: AsyncClient
    # The workflow id the agent is currently acting on. Tools can override.
    workflow_id: str | None = None


ToolCallable = Callable[[ToolContext, dict[str, Any]], Awaitable[ToolResult]]


# ── Tool registry ───────────────────────────────────────────────────────

@dataclass
class ToolSpec:
    name: str
    description: str
    params_schema: dict[str, Any]
    handler: ToolCallable
    mutates_canvas: bool = False


_REGISTRY: dict[str, ToolSpec] = {}


def register(
    *,
    name: str,
    description: str,
    params_schema: dict[str, Any],
    mutates_canvas: bool = False,
) -> Callable[[ToolCallable], ToolCallable]:
    """Decorator that registers a tool under ``name``."""

    def decorator(func: ToolCallable) -> ToolCallable:
        _REGISTRY[name] = ToolSpec(
            name=name,
            description=description,
            params_schema=params_schema,
            handler=func,
            mutates_canvas=mutates_canvas,
        )
        return func

    return decorator


def get_tool(name: str) -> ToolSpec | None:
    return _REGISTRY.get(name)


def iter_tool_specs() -> list[ToolSpec]:
    return list(_REGISTRY.values())
