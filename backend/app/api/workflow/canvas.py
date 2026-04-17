"""Workflow canvas routes for safe node/edge patch operations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from supabase import AsyncClient

from app.core.deps import check_workflow_access, get_current_user, get_supabase_client
from app.services.workflow_canvas_service import (
    CanvasPatchError,
    apply_canvas_patch,
    normalize_workflow_edge,
    normalize_workflow_node,
    validate_canvas,
)

router = APIRouter()

_CANVAS_COLS = "id,name,description,nodes_json,edges_json,updated_at"


class CanvasApplyRequest(BaseModel):
    base_updated_at: str | None = None
    dry_run: bool = False
    ops: list[dict[str, Any]] = Field(default_factory=list)


class CanvasValidateRequest(BaseModel):
    nodes_json: list[dict[str, Any]] | None = None
    edges_json: list[dict[str, Any]] | None = None
    ops: list[dict[str, Any]] | None = None


def _canvas_payload(row: dict[str, Any], *, id_map: dict[str, str] | None = None, warnings: list[dict[str, Any]] | None = None, dry_run: bool | None = None) -> dict[str, Any]:
    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    payload = {
        "id": row.get("id"),
        "name": row.get("name"),
        "description": row.get("description"),
        "nodes_json": nodes,
        "edges_json": edges,
        "updated_at": row.get("updated_at"),
        "node_count": len(nodes),
        "edge_count": len(edges),
    }
    if id_map is not None:
        payload["id_map"] = id_map
    if warnings is not None:
        payload["warnings"] = warnings
    if dry_run is not None:
        payload["dry_run"] = dry_run
    return payload


async def _fetch_workflow_canvas(db: AsyncClient, workflow_id: str) -> dict[str, Any]:
    result = (
        await db.from_("ss_workflows")
        .select(_CANVAS_COLS)
        .eq("id", workflow_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return result.data


def _patch_error_response(exc: CanvasPatchError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail={
            "code": exc.code,
            "message": str(exc),
            "detail": exc.detail,
        },
    )


@router.get("/{workflow_id}/canvas")
async def get_workflow_canvas(
    workflow_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Return a full editable workflow canvas snapshot."""
    await check_workflow_access(workflow_id, current_user["id"], "viewer", db)
    row = await _fetch_workflow_canvas(db, workflow_id)
    return _canvas_payload(row)


@router.post("/{workflow_id}/canvas/apply")
async def apply_workflow_canvas_patch(
    workflow_id: str,
    body: CanvasApplyRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Apply a batch of real node/edge operations to a workflow canvas."""
    await check_workflow_access(workflow_id, current_user["id"], "editor", db)
    row = await _fetch_workflow_canvas(db, workflow_id)

    if body.base_updated_at and str(row.get("updated_at")) != body.base_updated_at:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "workflow_conflict",
                "message": "Workflow was updated by another client. Re-read canvas and retry.",
                "current_updated_at": row.get("updated_at"),
            },
        )

    try:
        next_nodes, next_edges, id_map, warnings = apply_canvas_patch(
            row.get("nodes_json") or [],
            row.get("edges_json") or [],
            body.ops,
        )
    except CanvasPatchError as exc:
        raise _patch_error_response(exc) from exc

    preview_row = {**row, "nodes_json": next_nodes, "edges_json": next_edges}
    if body.dry_run:
        return _canvas_payload(preview_row, id_map=id_map, warnings=warnings, dry_run=True)

    update_result = (
        await db.from_("ss_workflows")
        .update({"nodes_json": next_nodes, "edges_json": next_edges})
        .eq("id", workflow_id)
        .execute()
    )
    if update_result.data is not None and len(update_result.data) == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")

    saved = await _fetch_workflow_canvas(db, workflow_id)
    return _canvas_payload(saved, id_map=id_map, warnings=warnings, dry_run=False)


@router.post("/{workflow_id}/canvas/validate")
async def validate_workflow_canvas(
    workflow_id: str,
    body: CanvasValidateRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Validate the current workflow canvas or a proposed patch preview."""
    await check_workflow_access(workflow_id, current_user["id"], "viewer", db)
    row = await _fetch_workflow_canvas(db, workflow_id)

    nodes = row.get("nodes_json") or []
    edges = row.get("edges_json") or []
    if body.nodes_json is not None or body.edges_json is not None:
        if body.nodes_json is None or body.edges_json is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="nodes_json and edges_json must be provided together",
            )
        nodes = body.nodes_json
        edges = body.edges_json

    if body.ops:
        try:
            nodes, edges, _id_map, warnings = apply_canvas_patch(nodes, edges, body.ops)
        except CanvasPatchError as exc:
            issues = []
            if isinstance(exc.detail, dict) and isinstance(exc.detail.get("issues"), list):
                issues = exc.detail["issues"]
            else:
                issues = [{"severity": "error", "code": exc.code, "message": str(exc), "detail": exc.detail}]
            return {"valid": False, "issues": issues, "warnings": []}
    else:
        warnings = []

    try:
        normalized_nodes = [normalize_workflow_node(node) for node in nodes]
        normalized_edges = [normalize_workflow_edge(edge, nodes=normalized_nodes) for edge in edges]
    except CanvasPatchError as exc:
        return {
            "valid": False,
            "issues": [{"severity": "error", "code": exc.code, "message": str(exc), "detail": exc.detail}],
            "warnings": warnings,
        }

    issues = validate_canvas(normalized_nodes, normalized_edges)
    return {
        "valid": not any(issue.get("severity") == "error" for issue in issues),
        "issues": issues,
        "warnings": warnings,
    }
