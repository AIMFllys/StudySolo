"""Canvas CRUD tools — persist to DB via ``apply_canvas_patch``.

All tools in this module accept an explicit ``workflow_id`` or fall back to
``ctx.workflow_id``. Node/edge targets can be resolved by id OR by label
(case-insensitive, trimmed) so the LLM doesn't have to remember UUIDs.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.workflow_canvas_service import (
    CanvasPatchError,
    apply_canvas_patch,
)

from .base import CanvasMutation, ToolContext, ToolResult, register

logger = logging.getLogger(__name__)


_WRITABLE_DATA_FIELDS = {
    "label",
    "system_prompt",
    "model_route",
    "output_format",
    "config",
    "user_content",
    "status",
    "output",
    # loop_group 容器专属字段
    "maxIterations",
    "intervalSeconds",
}

# Top-level node fields the LLM is allowed to patch via `update_node`.
# `parentId` lets it move a node into a `loop_group` container; `extent`
# controls whether the child may be dragged outside the parent.
_WRITABLE_META_FIELDS = {
    "parentId",
    "extent",
}


async def _load_workflow(ctx: ToolContext, workflow_id: str) -> dict[str, Any] | None:
    result = (
        await ctx.db.from_("ss_workflows")
        .select("id,name,nodes_json,edges_json")
        .eq("id", workflow_id)
        .eq("user_id", ctx.user["id"])
        .maybe_single()
        .execute()
    )
    if not result or not result.data:
        return None
    return result.data


async def _save_canvas(
    ctx: ToolContext,
    workflow_id: str,
    nodes: list[dict[str, Any]],
    edges: list[dict[str, Any]],
) -> None:
    await (
        ctx.db.from_("ss_workflows")
        .update({"nodes_json": nodes, "edges_json": edges})
        .eq("id", workflow_id)
        .eq("user_id", ctx.user["id"])
        .execute()
    )


def _resolve_node(nodes: list[dict[str, Any]], label_or_id: str) -> dict[str, Any] | None:
    """Look up a node by id first, then by fuzzy label match."""
    if not label_or_id:
        return None
    needle = label_or_id.strip()
    lower = needle.lower()
    for n in nodes:
        if str(n.get("id")) == needle:
            return n
    for n in nodes:
        label = str((n.get("data") or {}).get("label") or "").strip().lower()
        if label and label == lower:
            return n
    for n in nodes:
        label = str((n.get("data") or {}).get("label") or "").strip().lower()
        if label and (lower in label or label in lower):
            return n
    return None


def _require_workflow_id(ctx: ToolContext, params: dict[str, Any]) -> str | None:
    return params.get("workflow_id") or ctx.workflow_id


# ── read_canvas ──────────────────────────────────────────────────────────

@register(
    name="read_canvas",
    description="读取指定工作流的最新 nodes/edges（可选 workflow_id，默认当前画布）。",
    params_schema={
        "type": "object",
        "properties": {"workflow_id": {"type": "string"}},
    },
)
async def read_canvas_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    summary = [
        {
            "id": n.get("id"),
            "type": n.get("type") or (n.get("data") or {}).get("type"),
            "label": (n.get("data") or {}).get("label"),
            "status": (n.get("data") or {}).get("status") or "pending",
        }
        for n in nodes
    ]
    return ToolResult(
        ok=True,
        data={
            "workflow_id": wf_id,
            "name": row.get("name"),
            "node_count": len(nodes),
            "edge_count": len(edges),
            "nodes": summary,
            "edges": [
                {"id": e.get("id"), "source": e.get("source"), "target": e.get("target")}
                for e in edges
            ],
        },
    )


# ── add_node ─────────────────────────────────────────────────────────────

@register(
    name="add_node",
    description=(
        "向画布添加一个节点。node_type 必须是已知类型（如 ai_analyzer/summary/flashcard 等）。"
        "可选 anchor 指定在哪个现有节点（label 或 id）之后创建并连接。"
    ),
    params_schema={
        "type": "object",
        "required": ["node_type"],
        "properties": {
            "workflow_id": {"type": "string"},
            "node_type": {"type": "string"},
            "label": {"type": "string"},
            "anchor": {"type": "string", "description": "锚点节点 label 或 id，新节点会连在其后"},
            "position": {
                "type": "object",
                "properties": {"x": {"type": "number"}, "y": {"type": "number"}},
            },
            "data": {"type": "object", "description": "附加 data 字段（system_prompt/model_route/config 等）"},
        },
    },
    mutates_canvas=True,
)
async def add_node_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    node_type = str(params.get("node_type") or "").strip()
    if not node_type:
        return ToolResult(ok=False, error="缺少 node_type")

    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")

    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []

    anchor_node = None
    anchor_raw = params.get("anchor")
    if isinstance(anchor_raw, str) and anchor_raw.strip():
        anchor_node = _resolve_node(nodes, anchor_raw)
        if anchor_node is None:
            return ToolResult(
                ok=False,
                error=f"找不到锚点节点「{anchor_raw}」。可用节点: "
                + ", ".join((str((n.get('data') or {}).get('label')) or str(n.get('id'))) for n in nodes[:10]),
            )

    new_node_client_id = "new_node"
    create_node_op: dict[str, Any] = {
        "op": "create_node",
        "client_id": new_node_client_id,
        "node_type": node_type,
        "label": params.get("label") if isinstance(params.get("label"), str) else None,
        "position": params.get("position") if isinstance(params.get("position"), dict) else None,
        "data": params.get("data") if isinstance(params.get("data"), dict) else {},
    }
    # When an anchor is specified and no explicit position was given, pass the
    # anchor id through as a layout hint so the canvas service can place the
    # new node next to its predecessor (and fan out `logic_switch` branches
    # along Y instead of stacking them).
    if anchor_node and not isinstance(params.get("position"), dict):
        create_node_op["anchor_node_id"] = anchor_node["id"]

    ops: list[dict[str, Any]] = [create_node_op]
    if anchor_node:
        ops.append({
            "op": "create_edge",
            "source": anchor_node["id"],
            "target": f"${new_node_client_id}",
        })

    try:
        next_nodes, next_edges, id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    created_id = id_map.get(new_node_client_id)
    return ToolResult(
        ok=True,
        data={"created_node_id": created_id, "node_type": node_type},
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


# ── update_node ──────────────────────────────────────────────────────────

@register(
    name="update_node",
    description=(
        "修改一个现有节点。target 可以是 label 或 id。updates 是合并 patch，含两类字段：\n"
        "  - data 白名单: label / system_prompt / model_route / output_format / config / "
        "user_content / status / output / maxIterations / intervalSeconds\n"
        "  - 节点元信息白名单: parentId（把节点装入某个 loop_group 容器）/ extent（'parent' 让子节点不能拖出容器）"
    ),
    params_schema={
        "type": "object",
        "required": ["target", "updates"],
        "properties": {
            "workflow_id": {"type": "string"},
            "target": {"type": "string"},
            "updates": {"type": "object"},
        },
    },
    mutates_canvas=True,
)
async def update_node_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    target = str(params.get("target") or "").strip()
    if not target:
        return ToolResult(ok=False, error="缺少 target")
    raw_updates = params.get("updates")
    if not isinstance(raw_updates, dict) or not raw_updates:
        return ToolResult(ok=False, error="updates 必须是非空对象")

    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    node = _resolve_node(nodes, target)
    if not node:
        return ToolResult(
            ok=False,
            error=f"找不到节点「{target}」。可用节点: "
            + ", ".join((str((n.get('data') or {}).get('label')) or str(n.get('id'))) for n in nodes[:10]),
        )

    filtered: dict[str, Any] = {}
    meta_filtered: dict[str, Any] = {}
    rejected: list[str] = []
    for key, value in raw_updates.items():
        if key in _WRITABLE_DATA_FIELDS:
            filtered[key] = value
        elif key in _WRITABLE_META_FIELDS:
            meta_filtered[key] = value
        else:
            rejected.append(key)
    if not filtered and not meta_filtered:
        return ToolResult(
            ok=False,
            error=(
                "updates 中没有任何白名单字段。允许字段: "
                + ", ".join(sorted(_WRITABLE_DATA_FIELDS | _WRITABLE_META_FIELDS))
            ),
        )

    # When the LLM references a parent via label (e.g. "复习循环") instead of a
    # node id, resolve it here so the canvas service sees a clean id string.
    if "parentId" in meta_filtered and isinstance(meta_filtered["parentId"], str):
        raw_parent = meta_filtered["parentId"].strip()
        if raw_parent and not raw_parent.startswith("$"):
            resolved_parent = _resolve_node(nodes, raw_parent)
            if resolved_parent is not None:
                meta_filtered["parentId"] = resolved_parent["id"]

    op: dict[str, Any] = {
        "op": "update_node_data",
        "node_id": node["id"],
    }
    if filtered:
        op["data"] = filtered
    if meta_filtered:
        op["meta"] = meta_filtered
    ops = [op]
    try:
        next_nodes, next_edges, _id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={
            "updated_node_id": node["id"],
            "applied_fields": sorted(filtered.keys()),
            "applied_meta_fields": sorted(meta_filtered.keys()),
            "ignored_fields": rejected,
        },
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


# ── delete_node ──────────────────────────────────────────────────────────

@register(
    name="delete_node",
    description="删除一个节点（及其关联的边）。target 可为 label 或 id。禁止删到零节点。",
    params_schema={
        "type": "object",
        "required": ["target"],
        "properties": {
            "workflow_id": {"type": "string"},
            "target": {"type": "string"},
        },
    },
    mutates_canvas=True,
)
async def delete_node_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    target = str(params.get("target") or "").strip()
    if not target:
        return ToolResult(ok=False, error="缺少 target")

    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    node = _resolve_node(nodes, target)
    if not node:
        return ToolResult(ok=False, error=f"找不到节点「{target}」")
    if len(nodes) <= 1:
        return ToolResult(ok=False, error="至少保留一个节点，不能删除最后一个")

    ops = [{"op": "delete_node", "node_id": node["id"], "confirm_delete": True}]
    try:
        next_nodes, next_edges, _id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={"deleted_node_id": node["id"]},
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


# ── add_edge / delete_edge ───────────────────────────────────────────────

@register(
    name="add_edge",
    description="在两个节点之间添加一条顺序边。source / target 可为 label 或 id。",
    params_schema={
        "type": "object",
        "required": ["source", "target"],
        "properties": {
            "workflow_id": {"type": "string"},
            "source": {"type": "string"},
            "target": {"type": "string"},
        },
    },
    mutates_canvas=True,
)
async def add_edge_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    src = _resolve_node(nodes, str(params.get("source") or ""))
    dst = _resolve_node(nodes, str(params.get("target") or ""))
    if not src or not dst:
        return ToolResult(ok=False, error="source 或 target 无法解析为已知节点")

    ops = [{"op": "create_edge", "source": src["id"], "target": dst["id"]}]
    try:
        next_nodes, next_edges, _id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={"source": src["id"], "target": dst["id"]},
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


@register(
    name="delete_edge",
    description="删除一条边。支持按 edge_id 或 source/target (label 或 id) 删除。",
    params_schema={
        "type": "object",
        "properties": {
            "workflow_id": {"type": "string"},
            "edge_id": {"type": "string"},
            "source": {"type": "string"},
            "target": {"type": "string"},
        },
    },
    mutates_canvas=True,
)
async def delete_edge_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []

    op: dict[str, Any] = {"op": "delete_edge", "confirm_delete": True}
    edge_id = params.get("edge_id")
    if isinstance(edge_id, str) and edge_id.strip():
        op["edge_id"] = edge_id.strip()
    else:
        src = _resolve_node(nodes, str(params.get("source") or ""))
        dst = _resolve_node(nodes, str(params.get("target") or ""))
        if not src or not dst:
            return ToolResult(ok=False, error="source 或 target 无法解析为已知节点")
        op["source"] = src["id"]
        op["target"] = dst["id"]

    try:
        next_nodes, next_edges, _id_map, _warnings = apply_canvas_patch(nodes, edges, [op])
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={"removed_edge": True},
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


# ── add_branching (high-level) ───────────────────────────────────────────

@register(
    name="add_branching",
    description=(
        "在 anchor 之后一次性搭建一个 logic_switch + 多路下游：一次调用即可完成"
        "「加分支节点 → 为每路加子节点 → 连线」。分支字母 A/B/C… 由系统自动分配。"
    ),
    params_schema={
        "type": "object",
        "required": ["anchor", "branches"],
        "properties": {
            "workflow_id": {"type": "string"},
            "anchor": {"type": "string", "description": "作为分支入口的上游节点 label 或 id"},
            "switch_label": {"type": "string", "description": "logic_switch 节点的标签，默认「条件分支」"},
            "branches": {
                "type": "array",
                "minItems": 2,
                "description": "每一路分支目标节点的描述。长度决定了分支数。",
                "items": {
                    "type": "object",
                    "required": ["node_type"],
                    "properties": {
                        "node_type": {"type": "string"},
                        "label": {"type": "string"},
                        "data": {"type": "object"},
                    },
                },
            },
        },
    },
    mutates_canvas=True,
)
async def add_branching_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    anchor_raw = str(params.get("anchor") or "").strip()
    if not anchor_raw:
        return ToolResult(ok=False, error="缺少 anchor")
    branches = params.get("branches")
    if not isinstance(branches, list) or len(branches) < 2:
        return ToolResult(ok=False, error="branches 至少需要 2 路")

    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []

    anchor_node = _resolve_node(nodes, anchor_raw)
    if anchor_node is None:
        return ToolResult(ok=False, error=f"找不到锚点节点「{anchor_raw}」")

    switch_label = params.get("switch_label") if isinstance(params.get("switch_label"), str) else None
    switch_client_id = "switch_root"
    ops: list[dict[str, Any]] = [
        {
            "op": "create_node",
            "client_id": switch_client_id,
            "node_type": "logic_switch",
            "label": switch_label or "条件分支",
            "anchor_node_id": anchor_node["id"],
        },
        {
            "op": "create_edge",
            "source": anchor_node["id"],
            "target": f"${switch_client_id}",
        },
    ]

    branch_client_ids: list[str] = []
    for index, branch in enumerate(branches):
        if not isinstance(branch, dict):
            return ToolResult(ok=False, error=f"branches[{index}] 必须是对象")
        node_type = str(branch.get("node_type") or "").strip()
        if not node_type:
            return ToolResult(ok=False, error=f"branches[{index}] 缺少 node_type")
        client_id = f"branch_{index}"
        branch_client_ids.append(client_id)
        ops.append({
            "op": "create_node",
            "client_id": client_id,
            "node_type": node_type,
            "label": branch.get("label") if isinstance(branch.get("label"), str) else None,
            "data": branch.get("data") if isinstance(branch.get("data"), dict) else {},
            # Anchor to the switch so layout can fan branches along Y.
            "anchor_node_id": f"${switch_client_id}",
        })
        ops.append({
            "op": "create_edge",
            "source": f"${switch_client_id}",
            "target": f"${client_id}",
        })

    try:
        next_nodes, next_edges, id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={
            "switch_node_id": id_map.get(switch_client_id),
            "branch_node_ids": [id_map.get(cid) for cid in branch_client_ids],
            "branch_count": len(branch_client_ids),
        },
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )


# ── wrap_into_loop_group (high-level) ────────────────────────────────────

@register(
    name="wrap_into_loop_group",
    description=(
        "把若干已存在的节点一次性装入一个新建的 loop_group 容器（按 maxIterations 轮循环）。"
        "省去「add_node loop_group → 多次 update_node parentId」的重复调用。"
    ),
    params_schema={
        "type": "object",
        "required": ["targets"],
        "properties": {
            "workflow_id": {"type": "string"},
            "label": {"type": "string", "description": "loop_group 标签，默认「循环容器」"},
            "max_iterations": {"type": "integer", "minimum": 1, "maximum": 50},
            "interval_seconds": {"type": "number", "minimum": 0},
            "targets": {
                "type": "array",
                "minItems": 1,
                "description": "要放入容器的已有节点 label 或 id 列表",
                "items": {"type": "string"},
            },
        },
    },
    mutates_canvas=True,
)
async def wrap_into_loop_group_tool(ctx: ToolContext, params: dict[str, Any]) -> ToolResult:
    wf_id = _require_workflow_id(ctx, params)
    if not wf_id:
        return ToolResult(ok=False, error="需要 workflow_id")
    targets_raw = params.get("targets")
    if not isinstance(targets_raw, list) or not targets_raw:
        return ToolResult(ok=False, error="targets 至少需要 1 个节点")

    row = await _load_workflow(ctx, wf_id)
    if not row:
        return ToolResult(ok=False, error=f"找不到工作流 {wf_id}")
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []

    resolved_ids: list[str] = []
    unresolved: list[str] = []
    for target in targets_raw:
        if not isinstance(target, str):
            continue
        node = _resolve_node(nodes, target)
        if node is None:
            unresolved.append(target)
        elif node["id"] in resolved_ids:
            continue
        else:
            resolved_ids.append(node["id"])
    if unresolved:
        return ToolResult(
            ok=False,
            error=f"找不到节点: {', '.join(unresolved)}",
        )
    if not resolved_ids:
        return ToolResult(ok=False, error="没有任何 targets 解析到已存在的节点")

    loop_data: dict[str, Any] = {}
    if isinstance(params.get("max_iterations"), int):
        loop_data["maxIterations"] = params["max_iterations"]
    if isinstance(params.get("interval_seconds"), (int, float)):
        loop_data["intervalSeconds"] = params["interval_seconds"]

    group_client_id = "loop_group_root"
    ops: list[dict[str, Any]] = [
        {
            "op": "create_node",
            "client_id": group_client_id,
            "node_type": "loop_group",
            "label": params.get("label") if isinstance(params.get("label"), str) else "循环容器",
            "data": loop_data,
        }
    ]
    for node_id in resolved_ids:
        ops.append({
            "op": "update_node_data",
            "node_id": node_id,
            "meta": {"parentId": f"${group_client_id}"},
        })

    try:
        next_nodes, next_edges, id_map, _warnings = apply_canvas_patch(nodes, edges, ops)
    except CanvasPatchError as exc:
        return ToolResult(ok=False, error=f"[{exc.code}] {exc}")

    await _save_canvas(ctx, wf_id, next_nodes, next_edges)
    return ToolResult(
        ok=True,
        data={
            "loop_group_id": id_map.get(group_client_id),
            "wrapped_node_ids": resolved_ids,
            "wrapped_count": len(resolved_ids),
        },
        canvas_mutation=CanvasMutation(workflow_id=wf_id, nodes=next_nodes, edges=next_edges),
    )
