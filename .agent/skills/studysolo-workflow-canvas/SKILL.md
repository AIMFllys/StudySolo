---
name: studysolo-workflow-canvas
description: Use StudySolo MCP to create, read, and edit real workflow canvas node instances and edges. This is for editing workflow instances, not for developing new node types, APIs, or models.
triggers:
  - "MCP workflow canvas"
  - "create workflow node with MCP"
  - "edit StudySolo workflow nodes"
  - "real workflow node"
  - "apply_workflow_canvas_patch"
allowed-tools: MCP
version: 1.0
priority: HIGH
---

# StudySolo Workflow Canvas MCP Skill

## Goal

Use StudySolo MCP to edit **real workflow node instances**. A node is not a name, label, or type string. Real nodes must be persisted in `nodes_json`, and real edges must be persisted in `edges_json`, using the shape expected by React Flow and the StudySolo execution engine.

## Required Flow

1. Call `get_nodes_manifest` to confirm available `node_type` values and config fields.
2. If the user did not provide `workflow_id`, call `create_workflow`.
3. Call `get_workflow_canvas` to read `nodes_json`, `edges_json`, and `updated_at`.
4. Convert the user request into `apply_workflow_canvas_patch` ops.
5. For multi-node or destructive edits, call `apply_workflow_canvas_patch` with `dry_run=true` first.
6. If dry-run has no errors, call the same ops with `dry_run=false`.
7. Call `get_workflow_canvas` again to confirm the real nodes and edges were saved.
8. If execution is needed, call `run_workflow_and_wait` after validation.

## Node Creation Rules

- `node_type` is the executable node type, for example `trigger_input`, `summary`, or `quiz_gen`.
- `label` is display text only. Do not treat a label as the node instance.
- Create nodes with `op=create_node`; let the backend build the complete node instance.
- Do not send incomplete objects such as `{ "name": "Summary node" }`.
- Preserve non-English `label`, `user_content`, and `config` values exactly as JSON strings.

Recommended ops:

```json
[
  {
    "op": "create_node",
    "client_id": "input_1",
    "node_type": "trigger_input",
    "label": "Chinese input",
    "position": { "x": 120, "y": 120 },
    "data": { "user_content": "Study machine learning basics" }
  },
  {
    "op": "create_node",
    "client_id": "summary_1",
    "node_type": "summary",
    "label": "Summary",
    "position": { "x": 460, "y": 120 },
    "data": { "config": {} }
  },
  {
    "op": "create_edge",
    "client_id": "edge_1",
    "source": "$input_1",
    "target": "$summary_1"
  }
]
```

## Prohibited Actions

- Do not overwrite the entire `nodes_json` / `edges_json` directly.
- Do not invent node types. Use only manifest node types.
- Do not delete nodes or edges unless the user explicitly asks; delete ops must include `confirm_delete: true`.
- Do not use `workflow-node-builder` for this task. That skill is for implementing new node types, APIs, or models.
- Do not expose PAT values. Credentials belong only in the MCP Host environment.

## Conflict Handling

If `apply_workflow_canvas_patch` returns `HTTP_409` or `workflow_conflict`:

1. Call `get_workflow_canvas` again.
2. Rebuild ops against the latest graph and `updated_at`.
3. Dry-run again, then save.
