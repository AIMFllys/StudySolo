"""Agent-loop tool registry.

Each tool is an async callable with signature ``(ctx, params) -> ToolResult``
where ``ctx`` is a :class:`ToolContext` carrying the authenticated user and
db handles.

Tools deliberately live in small per-file modules so they stay readable and
are easy to smoke-test in isolation.
"""

from __future__ import annotations

from .base import (
    CanvasMutation,
    ToolContext,
    ToolResult,
    ToolSpec,
    UIEffect,
    get_tool,
    iter_tool_specs,
    register,
)
from .canvas_tools import (  # noqa: F401  (side-effect: register)
    add_edge_tool,
    add_node_tool,
    delete_edge_tool,
    delete_node_tool,
    read_canvas_tool,
    update_node_tool,
)
from .run_tools import (  # noqa: F401
    get_workflow_run_status_tool,
    start_workflow_background_tool,
)
from .workflow_tools import (  # noqa: F401
    batch_rename_workflows_tool,
    list_workflows_tool,
    open_workflow_tool,
    rename_workflow_tool,
)

__all__ = [
    "CanvasMutation",
    "ToolContext",
    "ToolResult",
    "ToolSpec",
    "UIEffect",
    "get_tool",
    "iter_tool_specs",
    "register",
]
