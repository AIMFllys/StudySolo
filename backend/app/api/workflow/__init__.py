"""Workflow route aggregation — Task 2.3 result.

Consolidates workflow CRUD, execute, social, and collaboration routes.
Note: workflow_runs is kept as a separate mount at /workflow-runs for
backward-compatible URL paths (frontend depends on /api/workflow-runs/*).

Replaces 4 separate workflow route imports in router.py with a single:
    from app.api.workflow import router as workflow_router
"""

from fastapi import APIRouter

from app.api.workflow.crud import router as crud_router
from app.api.workflow.execute import router as execute_router
from app.api.workflow.social import router as social_router
from app.api.workflow.canvas import router as canvas_router
from app.api.workflow.collaboration import router as collaboration_router

router = APIRouter()
# NOTE: crud_router defines root-path routes (path == ""). FastAPI forbids
# `prefix="" + path=""` when include_router is invoked, so we attach the
# /workflow prefix here instead of on the outer aggregator's include call.
# The outer router mounts this package at prefix="" (see app/api/router.py).
router.include_router(crud_router, prefix="/workflow", tags=["workflow"])
router.include_router(execute_router, prefix="/workflow", tags=["workflow-execute"])
router.include_router(canvas_router, prefix="/workflow", tags=["workflow-canvas"])
router.include_router(social_router, prefix="/workflow", tags=["workflow-social"])
router.include_router(collaboration_router, prefix="/workflow", tags=["workflow-collaboration"])
