"""Workflow canvas editing tools for real node/edge instances."""

from __future__ import annotations

from typing import Any
from urllib.parse import quote

from mcp.types import Tool

from studysolo_mcp.client import ApiClient


TOOLS: list[Tool] = [
    Tool(
        name="create_workflow",
        description="Create an empty workflow. Returns workflow id and updated_at; read the canvas before editing nodes.",
        inputSchema={
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Workflow name."},
                "description": {"type": "string", "description": "Optional workflow description."},
            },
            "required": ["name"],
            "additionalProperties": False,
        },
    ),
    Tool(
        name="get_workflow_canvas",
        description=(
            "Read the real React Flow canvas JSON for a workflow: nodes_json, edges_json, updated_at, node_count, edge_count. "
            "Call this before creating or modifying nodes so base_updated_at is available."
        ),
        inputSchema={
            "type": "object",
            "properties": {"workflow_id": {"type": "string", "description": "Workflow ID."}},
            "required": ["workflow_id"],
            "additionalProperties": False,
        },
    ),
    Tool(
        name="get_workflow_node",
        description="Read one real node instance plus incoming_edges and outgoing_edges. A label is only display text, not a node instance.",
        inputSchema={
            "type": "object",
            "properties": {
                "workflow_id": {"type": "string"},
                "node_id": {"type": "string"},
            },
            "required": ["workflow_id", "node_id"],
            "additionalProperties": False,
        },
    ),
    Tool(
        name="apply_workflow_canvas_patch",
        description=(
            "Batch create/update/delete real workflow nodes and edges. To create a node, use op=create_node with node_type. "
            "label is display text only; the backend creates the complete executable node instance. Prefer one batch patch for multi-node edits."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "workflow_id": {"type": "string"},
                "base_updated_at": {"type": "string", "description": "updated_at from get_workflow_canvas for conflict detection."},
                "dry_run": {"type": "boolean", "default": True, "description": "When true, preview only. Use dry_run first for complex edits."},
                "ops": {
                    "type": "array",
                    "description": "Canvas operations: create_node/update_node_data/move_node/delete_node/create_edge/update_edge_data/delete_edge.",
                    "items": {"type": "object"},
                },
            },
            "required": ["workflow_id", "ops"],
            "additionalProperties": False,
        },
    ),
    Tool(
        name="validate_workflow_canvas",
        description="Validate the current canvas or proposed ops, returning unknown node types, missing endpoints, self edges, cycles, or orphan nodes.",
        inputSchema={
            "type": "object",
            "properties": {
                "workflow_id": {"type": "string"},
                "nodes_json": {"type": "array", "items": {"type": "object"}},
                "edges_json": {"type": "array", "items": {"type": "object"}},
                "ops": {"type": "array", "items": {"type": "object"}},
            },
            "required": ["workflow_id"],
            "additionalProperties": False,
        },
    ),
    Tool(
        name="get_node_config_options",
        description="Read dynamic options for a node config field, for example knowledge_base/document_ids. node_type must come from get_nodes_manifest.",
        inputSchema={
            "type": "object",
            "properties": {
                "node_type": {"type": "string", "description": "Node type, not label."},
                "field_key": {"type": "string", "description": "Config field key."},
            },
            "required": ["node_type", "field_key"],
            "additionalProperties": False,
        },
    ),
]


def _require_string(args: dict[str, Any], key: str) -> str:
    value = args.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{key} is required")
    return value.strip()


async def create_workflow(client: ApiClient, args: dict[str, Any]) -> Any:
    name = _require_string(args, "name")
    description = args.get("description")
    return await client.post(
        "/api/workflow",
        json_body={"name": name, "description": description if isinstance(description, str) else None},
    )


async def get_workflow_canvas(client: ApiClient, args: dict[str, Any]) -> Any:
    workflow_id = _require_string(args, "workflow_id")
    return await client.get(f"/api/workflow/{workflow_id}/canvas")


async def get_workflow_node(client: ApiClient, args: dict[str, Any]) -> Any:
    workflow_id = _require_string(args, "workflow_id")
    node_id = _require_string(args, "node_id")
    canvas = await client.get(f"/api/workflow/{workflow_id}/canvas")
    nodes = canvas.get("nodes_json") or []
    edges = canvas.get("edges_json") or []
    node = next((item for item in nodes if item.get("id") == node_id), None)
    if node is None:
        raise ValueError(f"node_id not found: {node_id}")
    return {
        "workflow_id": workflow_id,
        "node": node,
        "incoming_edges": [edge for edge in edges if edge.get("target") == node_id],
        "outgoing_edges": [edge for edge in edges if edge.get("source") == node_id],
    }


async def apply_workflow_canvas_patch(client: ApiClient, args: dict[str, Any]) -> Any:
    workflow_id = _require_string(args, "workflow_id")
    ops = args.get("ops")
    if not isinstance(ops, list):
        raise ValueError("ops must be an array")
    payload: dict[str, Any] = {"ops": ops}
    if "base_updated_at" in args:
        payload["base_updated_at"] = args.get("base_updated_at")
    if "dry_run" in args:
        payload["dry_run"] = bool(args.get("dry_run"))
    return await client.post(f"/api/workflow/{workflow_id}/canvas/apply", json_body=payload)


async def validate_workflow_canvas(client: ApiClient, args: dict[str, Any]) -> Any:
    workflow_id = _require_string(args, "workflow_id")
    payload: dict[str, Any] = {}
    for key in ("nodes_json", "edges_json", "ops"):
        if key in args:
            payload[key] = args[key]
    return await client.post(f"/api/workflow/{workflow_id}/canvas/validate", json_body=payload)


async def get_node_config_options(client: ApiClient, args: dict[str, Any]) -> Any:
    node_type = quote(_require_string(args, "node_type"), safe="")
    field_key = quote(_require_string(args, "field_key"), safe="")
    return await client.get(f"/api/nodes/config-options/{node_type}/{field_key}")
