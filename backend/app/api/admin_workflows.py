"""Admin Workflow Monitoring API.

Endpoints:
  GET /workflows/stats    — aggregate stats from ss_workflow_runs
  GET /workflows/running  — currently running workflows (status='running')
  GET /workflows/errors   — failed or long-running workflows
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-workflows"])


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------


class WorkflowStats(BaseModel):
    total_runs: int
    completed: int
    failed: int
    running: int
    success_rate: float  # 0.0 - 1.0
    avg_duration_seconds: float | None
    total_tokens_used: int


class RunningWorkflow(BaseModel):
    id: str
    workflow_id: str
    user_id: str
    started_at: str
    current_step: int | None
    total_steps: int | None
    current_node: str | None
    elapsed_seconds: float | None


class ErrorWorkflow(BaseModel):
    id: str
    workflow_id: str
    user_id: str
    status: str
    started_at: str
    completed_at: str | None
    elapsed_seconds: float | None


class WorkflowStatsResponse(BaseModel):
    stats: WorkflowStats
    time_range: str


class RunningWorkflowsResponse(BaseModel):
    running: list[RunningWorkflow]
    total: int


class ErrorWorkflowsResponse(BaseModel):
    errors: list[ErrorWorkflow]
    total: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

LONG_RUNNING_THRESHOLD_SECONDS = 300  # 5 minutes


def _elapsed(started_at_str: str | None) -> float | None:
    if not started_at_str:
        return None
    try:
        started = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return (now - started).total_seconds()
    except Exception:
        return None


def _duration(started_at_str: str | None, completed_at_str: str | None) -> float | None:
    if not started_at_str or not completed_at_str:
        return None
    try:
        started = datetime.fromisoformat(started_at_str.replace("Z", "+00:00"))
        completed = datetime.fromisoformat(completed_at_str.replace("Z", "+00:00"))
        return (completed - started).total_seconds()
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/workflows/stats", response_model=WorkflowStatsResponse)
async def get_workflow_stats(
    time_range: Literal["7d", "30d", "90d"] = Query(default="7d"),
    db: AsyncClient = Depends(get_db),
) -> WorkflowStatsResponse:
    """Return aggregate workflow statistics for the given time range."""
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map[time_range]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        result = (
            await db.table("ss_workflow_runs")
            .select("id, status, started_at, completed_at, tokens_used")
            .gte("started_at", cutoff)
            .execute()
        )
        rows = result.data or []

        total_runs = len(rows)
        completed = sum(1 for r in rows if r.get("status") == "completed")
        failed = sum(1 for r in rows if r.get("status") == "failed")
        running = sum(1 for r in rows if r.get("status") == "running")
        success_rate = (completed / total_runs) if total_runs > 0 else 0.0
        total_tokens = sum(int(r.get("tokens_used") or 0) for r in rows)

        durations = [
            _duration(r.get("started_at"), r.get("completed_at"))
            for r in rows
            if r.get("status") == "completed"
        ]
        valid_durations = [d for d in durations if d is not None]
        avg_duration = (sum(valid_durations) / len(valid_durations)) if valid_durations else None

    except Exception as exc:
        logger.exception("Workflow stats query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取工作流统计失败")

    return WorkflowStatsResponse(
        stats=WorkflowStats(
            total_runs=total_runs,
            completed=completed,
            failed=failed,
            running=running,
            success_rate=round(success_rate, 4),
            avg_duration_seconds=avg_duration,
            total_tokens_used=total_tokens,
        ),
        time_range=time_range,
    )


@router.get("/workflows/running", response_model=RunningWorkflowsResponse)
async def get_running_workflows(
    db: AsyncClient = Depends(get_db),
) -> RunningWorkflowsResponse:
    """Return currently running workflows with progress info."""
    try:
        result = (
            await db.table("ss_workflow_runs")
            .select(
                "id, workflow_id, user_id, started_at, "
                "current_step, total_steps, current_node"
            )
            .eq("status", "running")
            .order("started_at", desc=True)
            .execute()
        )
        rows = result.data or []

        running = [
            RunningWorkflow(
                id=r["id"],
                workflow_id=r["workflow_id"],
                user_id=r["user_id"],
                started_at=str(r["started_at"]),
                current_step=r.get("current_step"),
                total_steps=r.get("total_steps"),
                current_node=r.get("current_node"),
                elapsed_seconds=_elapsed(r.get("started_at")),
            )
            for r in rows
        ]

    except Exception as exc:
        logger.exception("Running workflows query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取运行中工作流失败")

    return RunningWorkflowsResponse(running=running, total=len(running))


@router.get("/workflows/errors", response_model=ErrorWorkflowsResponse)
async def get_error_workflows(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncClient = Depends(get_db),
) -> ErrorWorkflowsResponse:
    """Return failed or long-running (> 5 min) workflows."""
    try:
        # Failed workflows
        failed_result = (
            await db.table("ss_workflow_runs")
            .select("id, workflow_id, user_id, status, started_at, completed_at", count="exact")
            .eq("status", "failed")
            .order("started_at", desc=True)
            .range((page - 1) * page_size, page * page_size - 1)
            .execute()
        )
        failed_rows = failed_result.data or []
        total = failed_result.count or 0

        errors = [
            ErrorWorkflow(
                id=r["id"],
                workflow_id=r["workflow_id"],
                user_id=r["user_id"],
                status=r["status"],
                started_at=str(r["started_at"]),
                completed_at=str(r["completed_at"]) if r.get("completed_at") else None,
                elapsed_seconds=_duration(r.get("started_at"), r.get("completed_at")),
            )
            for r in failed_rows
        ]

    except Exception as exc:
        logger.exception("Error workflows query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取错误工作流失败")

    return ErrorWorkflowsResponse(errors=errors, total=total)
