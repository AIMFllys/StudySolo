"""Admin Member Management API.

Endpoints:
  GET /members/stats   — tier distribution from user_profiles
  GET /members/list    — paid members (tier != 'free') with subscription info
  GET /members/revenue — MRR/ARR/ARPU from subscriptions
"""

import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-members"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class TierStats(BaseModel):
    free: int
    pro: int
    pro_plus: int
    ultra: int
    total: int
    paid_total: int


class MemberItem(BaseModel):
    user_id: str
    email: str | None
    tier: str
    subscription_status: str | None
    subscription_start: str | None
    subscription_end: str | None


class PaginatedMemberList(BaseModel):
    members: list[MemberItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class RevenueStats(BaseModel):
    active_subscriptions: int
    mrr: float  # Monthly Recurring Revenue (sum of amounts)
    arr: float  # Annual Recurring Revenue
    arpu: float  # Average Revenue Per User


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/members/stats", response_model=TierStats)
async def get_member_stats(
    db: AsyncClient = Depends(get_db),
) -> TierStats:
    """Return tier distribution from user_profiles."""
    try:
        result = (
            await db.table("user_profiles")
            .select("tier")
            .execute()
        )
        rows = result.data or []

        counts: dict[str, int] = {"free": 0, "pro": 0, "pro_plus": 0, "ultra": 0}
        for row in rows:
            t = row.get("tier", "free") or "free"
            if t in counts:
                counts[t] += 1
            else:
                counts["free"] += 1

        total = sum(counts.values())
        paid_total = counts["pro"] + counts["pro_plus"] + counts["ultra"]

    except Exception as exc:
        logger.exception("Member stats query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取会员统计失败")

    return TierStats(
        free=counts["free"],
        pro=counts["pro"],
        pro_plus=counts["pro_plus"],
        ultra=counts["ultra"],
        total=total,
        paid_total=paid_total,
    )


@router.get("/members/list", response_model=PaginatedMemberList)
async def get_member_list(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    tier: Literal["pro", "pro_plus", "ultra"] | None = Query(default=None),
    db: AsyncClient = Depends(get_db),
) -> PaginatedMemberList:
    """Return paid members (tier != 'free') with pagination."""
    try:
        query = (
            db.table("user_profiles")
            .select("id, email, tier", count="exact")
            .neq("tier", "free")
        )
        if tier is not None:
            query = query.eq("tier", tier)

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        result = await query.execute()
        rows = result.data or []
        total = result.count or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        members = [
            MemberItem(
                user_id=row["id"],
                email=row.get("email"),
                tier=row.get("tier", "free"),
                subscription_status=None,
                subscription_start=None,
                subscription_end=None,
            )
            for row in rows
        ]

    except Exception as exc:
        logger.exception("Member list query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取会员列表失败")

    return PaginatedMemberList(
        members=members,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/members/revenue", response_model=RevenueStats)
async def get_revenue_stats(
    db: AsyncClient = Depends(get_db),
) -> RevenueStats:
    """Return revenue statistics from subscriptions table."""
    try:
        result = (
            await db.table("subscriptions")
            .select("user_id, status, amount, billing_cycle")
            .eq("status", "active")
            .execute()
        )
        rows = result.data or []

        active_count = len(rows)
        # Sum monthly amounts (normalize annual to monthly)
        monthly_amounts: list[float] = []
        for row in rows:
            amount = float(row.get("amount") or 0)
            cycle = row.get("billing_cycle", "monthly")
            if cycle == "annual":
                monthly_amounts.append(amount / 12)
            else:
                monthly_amounts.append(amount)

        mrr = sum(monthly_amounts)
        arr = mrr * 12
        arpu = (mrr / active_count) if active_count > 0 else 0.0

    except Exception as exc:
        logger.exception("Revenue stats query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取收入统计失败")

    return RevenueStats(
        active_subscriptions=active_count,
        mrr=round(mrr, 2),
        arr=round(arr, 2),
        arpu=round(arpu, 2),
    )
