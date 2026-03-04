"""Admin Audit Log API.

Endpoints:
  GET /audit-logs  — paginated audit log with optional filters
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-audit"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class AuditLogItem(BaseModel):
    id: str
    admin_id: str | None
    admin_username: str | None
    action: str
    target_type: str | None
    target_id: str | None
    details: dict | None
    ip_address: str | None
    user_agent: str | None
    created_at: str


class PaginatedAuditLogs(BaseModel):
    logs: list[AuditLogItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/audit-logs", response_model=PaginatedAuditLogs)
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    action: str | None = Query(default=None),
    admin_id: str | None = Query(default=None),
    db: AsyncClient = Depends(get_db),
) -> PaginatedAuditLogs:
    """Return paginated audit logs with optional action/admin filters."""
    try:
        query = db.table("ss_admin_audit_logs").select(
            "id, admin_id, action, target_type, target_id, details, ip_address, user_agent, created_at",
            count="exact",
        )

        if action is not None:
            query = query.eq("action", action)
        if admin_id is not None:
            query = query.eq("admin_id", admin_id)

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        result = await query.execute()
        rows = result.data or []
        total = result.count or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        logs = [
            AuditLogItem(
                id=row["id"],
                admin_id=row.get("admin_id"),
                admin_username=None,  # No JOIN for performance; can be added later
                action=row["action"],
                target_type=row.get("target_type"),
                target_id=row.get("target_id"),
                details=row.get("details"),
                ip_address=row.get("ip_address"),
                user_agent=row.get("user_agent"),
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]

    except Exception as exc:
        logger.exception("Audit logs query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取审计日志失败")

    return PaginatedAuditLogs(
        logs=logs,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
