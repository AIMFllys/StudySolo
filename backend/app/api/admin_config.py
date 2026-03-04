"""Admin System Configuration API.

Endpoints:
  GET /config        — list all ss_system_config entries
  PUT /config        — upsert a config entry + audit log
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db
from app.services.audit_logger import get_client_info, log_action

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-config"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class ConfigEntry(BaseModel):
    key: str
    value: Any
    description: str | None
    updated_by: str | None
    updated_at: str | None


class ConfigListResponse(BaseModel):
    configs: list[ConfigEntry]
    total: int


class ConfigUpdateRequest(BaseModel):
    key: str
    value: Any
    description: str | None = None


class ConfigUpdateResponse(BaseModel):
    success: bool
    key: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/config", response_model=ConfigListResponse)
async def get_config(
    db: AsyncClient = Depends(get_db),
) -> ConfigListResponse:
    """Return all system configuration entries."""
    try:
        result = (
            await db.table("ss_system_config")
            .select("key, value, description, updated_by, updated_at")
            .order("key")
            .execute()
        )
        rows = result.data or []
        configs = [
            ConfigEntry(
                key=row["key"],
                value=row.get("value"),
                description=row.get("description"),
                updated_by=row.get("updated_by"),
                updated_at=str(row["updated_at"]) if row.get("updated_at") else None,
            )
            for row in rows
        ]
    except Exception as exc:
        logger.exception("Config list query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取系统配置失败")

    return ConfigListResponse(configs=configs, total=len(configs))


@router.put("/config", response_model=ConfigUpdateResponse)
async def update_config(
    body: ConfigUpdateRequest,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> ConfigUpdateResponse:
    """Upsert a system configuration entry and record audit log."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        upsert_data: dict[str, Any] = {
            "key": body.key,
            "value": body.value,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if body.description is not None:
            upsert_data["description"] = body.description
        if admin_id:
            upsert_data["updated_by"] = admin_id

        await db.table("ss_system_config").upsert(upsert_data).execute()

    except Exception as exc:
        logger.exception("Config update failed for key %s: %s", body.key, exc)
        raise HTTPException(status_code=500, detail="更新系统配置失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="config_update",
            target_type="system_config",
            target_id=body.key,
            details={"key": body.key, "value": body.value},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return ConfigUpdateResponse(success=True, key=body.key)
