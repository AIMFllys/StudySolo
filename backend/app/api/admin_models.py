"""Admin AI Model Management API.

Endpoints:
  GET  /models/status   — model config from ss_system_config + usage stats
  GET  /models/usage    — token usage aggregated from ss_workflow_runs
  PUT  /models/{id}/config — update model config in ss_system_config
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db
from app.services.audit_logger import get_client_info, log_action

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-models"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ModelConfig(BaseModel):
    model_id: str
    config: dict[str, Any]
    description: str | None
    updated_at: str | None


class ModelUsageStat(BaseModel):
    model_id: str
    total_tokens: int
    run_count: int


class ModelStatusResponse(BaseModel):
    models: list[ModelConfig]


class ModelUsageResponse(BaseModel):
    usage: list[ModelUsageStat]
    time_range: str


class ModelConfigUpdate(BaseModel):
    config: dict[str, Any]
    description: str | None = None


class ModelConfigUpdateResponse(BaseModel):
    success: bool
    model_id: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/models/status", response_model=ModelStatusResponse)
async def get_models_status(
    db: AsyncClient = Depends(get_db),
) -> ModelStatusResponse:
    """Return AI model configurations from ss_system_config."""
    try:
        result = (
            await db.table("ss_system_config")
            .select("key, value, description, updated_at")
            .ilike("key", "model.%")
            .execute()
        )
        rows = result.data or []

        models = [
            ModelConfig(
                model_id=row["key"].removeprefix("model."),
                config=row.get("value") or {},
                description=row.get("description"),
                updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
            )
            for row in rows
        ]

    except Exception as exc:
        logger.exception("Models status query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取模型配置失败")

    return ModelStatusResponse(models=models)


@router.get("/models/usage", response_model=ModelUsageResponse)
async def get_models_usage(
    time_range: Literal["7d", "30d", "90d"] = Query(default="7d"),
    db: AsyncClient = Depends(get_db),
) -> ModelUsageResponse:
    """Return token usage aggregated from ss_workflow_runs."""
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map[time_range]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        result = (
            await db.table("ss_workflow_runs")
            .select("tokens_used")
            .gte("started_at", cutoff)
            .execute()
        )
        rows = result.data or []

        # Aggregate total (no per-model breakdown without model_id field)
        total_tokens = sum(int(r.get("tokens_used") or 0) for r in rows)
        usage = [
            ModelUsageStat(
                model_id="all",
                total_tokens=total_tokens,
                run_count=len(rows),
            )
        ]

    except Exception as exc:
        logger.exception("Models usage query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取模型使用统计失败")

    return ModelUsageResponse(usage=usage, time_range=time_range)


@router.put("/models/{model_id}/config", response_model=ModelConfigUpdateResponse)
async def update_model_config(
    model_id: str,
    body: ModelConfigUpdate,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> ModelConfigUpdateResponse:
    """Update model configuration in ss_system_config."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)
    config_key = f"model.{model_id}"

    try:
        update_data: dict[str, Any] = {
            "value": body.config,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if body.description is not None:
            update_data["description"] = body.description
        if admin_id:
            update_data["updated_by"] = admin_id

        # Upsert: insert if not exists, update if exists
        await db.table("ss_system_config").upsert(
            {"key": config_key, **update_data}
        ).execute()

    except Exception as exc:
        logger.exception("Model config update failed for %s: %s", model_id, exc)
        raise HTTPException(status_code=500, detail="更新模型配置失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="model_config_update",
            target_type="model_config",
            target_id=config_key,
            details={"model_id": model_id, "config": body.config},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return ModelConfigUpdateResponse(success=True, model_id=model_id)
