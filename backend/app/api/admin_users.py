"""Admin Users API.

Endpoints:
  GET  /users              — paginated list with search + filters
  GET  /users/{id}         — user detail + subscription + usage stats
  PUT  /users/{id}/status  — toggle user_profiles.is_active
  PUT  /users/{id}/role    — change user_profiles.tier
"""

import asyncio
import logging
from datetime import date, datetime, timedelta, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db
from app.services.audit_logger import get_client_info, log_action

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-users"])

TierType = Literal["free", "pro", "pro_plus", "ultra"]

# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------


class UserListItem(BaseModel):
    id: str
    email: str
    tier: str
    is_active: bool
    created_at: str
    last_login: str | None


class PaginatedUserList(BaseModel):
    users: list[UserListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class SubscriptionInfo(BaseModel):
    id: str
    plan_id: str | None
    status: str
    current_period_end: str | None
    created_at: str


class UsageStats(BaseModel):
    total_runs: int
    total_tokens: int
    last_30_days_runs: int


class UserDetail(BaseModel):
    user: UserListItem
    subscription: SubscriptionInfo | None
    usage_stats: UsageStats


class StatusUpdateRequest(BaseModel):
    is_active: bool


class RoleUpdateRequest(BaseModel):
    tier: TierType


class StatusUpdateResponse(BaseModel):
    success: bool
    user_id: str
    is_active: bool


class RoleUpdateResponse(BaseModel):
    success: bool
    user_id: str
    tier: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/users", response_model=PaginatedUserList)
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    tier: TierType | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    created_after: date | None = Query(default=None),
    created_before: date | None = Query(default=None),
    db: AsyncClient = Depends(get_db),
) -> PaginatedUserList:
    """Return paginated user list with optional search and filters."""
    try:
        # Build query with filters
        query = db.table("user_profiles").select(
            "id, email, tier, is_active, created_at, last_login",
            count="exact",
        )

        if search:
            query = query.ilike("email", f"%{search}%")

        if tier is not None:
            query = query.eq("tier", tier)

        if is_active is not None:
            query = query.eq("is_active", is_active)

        if created_after is not None:
            query = query.gte("created_at", f"{created_after.isoformat()}T00:00:00+00:00")

        if created_before is not None:
            query = query.lte("created_at", f"{created_before.isoformat()}T23:59:59+00:00")

        # Pagination
        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        result = await query.execute()
        rows = result.data or []
        total = result.count or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        users = [
            UserListItem(
                id=row["id"],
                email=row["email"],
                tier=row.get("tier") or "free",
                is_active=row.get("is_active", True),
                created_at=str(row["created_at"]),
                last_login=str(row["last_login"]) if row.get("last_login") else None,
            )
            for row in rows
        ]

    except Exception as exc:
        logger.exception("User list query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取用户列表失败")

    return PaginatedUserList(
        users=users,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/users/{user_id}", response_model=UserDetail)
async def get_user_detail(
    user_id: str,
    db: AsyncClient = Depends(get_db),
) -> UserDetail:
    """Return user detail with subscription and usage statistics."""
    try:
        # 1. Fetch user profile
        profile_result = (
            await db.table("user_profiles")
            .select("id, email, tier, is_active, created_at, last_login")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        profile = profile_result.data if profile_result else None
        if not profile:
            raise HTTPException(status_code=404, detail="用户不存在")

        user = UserListItem(
            id=profile["id"],
            email=profile["email"],
            tier=profile.get("tier") or "free",
            is_active=profile.get("is_active", True),
            created_at=str(profile["created_at"]),
            last_login=str(profile["last_login"]) if profile.get("last_login") else None,
        )

        # 2. Fetch latest active subscription
        sub_result = (
            await db.table("subscriptions")
            .select("id, plan_id, status, current_period_end, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        sub_rows = sub_result.data or []
        subscription: SubscriptionInfo | None = None
        if sub_rows:
            s = sub_rows[0]
            subscription = SubscriptionInfo(
                id=s["id"],
                plan_id=s.get("plan_id"),
                status=s["status"],
                current_period_end=str(s["current_period_end"]) if s.get("current_period_end") else None,
                created_at=str(s["created_at"]),
            )

        # 3. Usage stats from ss_workflow_runs
        # Total runs
        total_runs_result = (
            await db.table("ss_workflow_runs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .execute()
        )
        total_runs: int = total_runs_result.count or 0

        # Total tokens
        tokens_result = (
            await db.table("ss_workflow_runs")
            .select("tokens_used")
            .eq("user_id", user_id)
            .execute()
        )
        total_tokens: int = sum(
            (row.get("tokens_used") or 0) for row in (tokens_result.data or [])
        )

        # Last 30 days runs
        cutoff_30d = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
        last_30d_result = (
            await db.table("ss_workflow_runs")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .gte("started_at", cutoff_30d)
            .execute()
        )
        last_30_days_runs: int = last_30d_result.count or 0

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("User detail query failed for %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="获取用户详情失败")

    return UserDetail(
        user=user,
        subscription=subscription,
        usage_stats=UsageStats(
            total_runs=total_runs,
            total_tokens=total_tokens,
            last_30_days_runs=last_30_days_runs,
        ),
    )


@router.put("/users/{user_id}/status", response_model=StatusUpdateResponse)
async def update_user_status(
    user_id: str,
    body: StatusUpdateRequest,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> StatusUpdateResponse:
    """Toggle user_profiles.is_active and record audit log."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        # Verify user exists and get current status
        existing_result = (
            await db.table("user_profiles")
            .select("id, is_active")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        existing = existing_result.data if existing_result else None
        if not existing:
            raise HTTPException(status_code=404, detail="用户不存在")

        old_status = existing.get("is_active", True)

        # Update is_active
        await db.table("user_profiles").update(
            {"is_active": body.is_active}
        ).eq("id", user_id).execute()

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("User status update failed for %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="更新用户状态失败")

    # Fire-and-forget audit log
    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="user_status_toggle",
            target_type="user",
            target_id=user_id,
            details={"before": old_status, "after": body.is_active},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return StatusUpdateResponse(
        success=True,
        user_id=user_id,
        is_active=body.is_active,
    )


@router.put("/users/{user_id}/role", response_model=RoleUpdateResponse)
async def update_user_role(
    user_id: str,
    body: RoleUpdateRequest,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> RoleUpdateResponse:
    """Change user_profiles.tier and record audit log."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        # Verify user exists and get current tier
        existing_result = (
            await db.table("user_profiles")
            .select("id, tier")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )
        existing = existing_result.data if existing_result else None
        if not existing:
            raise HTTPException(status_code=404, detail="用户不存在")

        old_tier = existing.get("tier") or "free"

        # Update tier
        await db.table("user_profiles").update(
            {"tier": body.tier}
        ).eq("id", user_id).execute()

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("User role update failed for %s: %s", user_id, exc)
        raise HTTPException(status_code=500, detail="更新用户角色失败")

    # Fire-and-forget audit log
    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="user_role_change",
            target_type="user",
            target_id=user_id,
            details={"before": old_tier, "after": body.tier},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return RoleUpdateResponse(
        success=True,
        user_id=user_id,
        tier=body.tier,
    )
