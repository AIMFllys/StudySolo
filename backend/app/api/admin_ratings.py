"""Admin Ratings API.

Endpoints:
  GET /ratings/overview  — NPS/CSAT aggregated from ss_ratings
  GET /ratings/details   — paginated rating details with user info
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase._async.client import AsyncClient

from app.core.database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-ratings"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class RatingOverview(BaseModel):
    nps_count: int
    nps_avg: float | None
    nps_score: float | None  # NPS = % promoters (9-10) - % detractors (0-6)
    csat_count: int
    csat_avg: float | None


class RatingItem(BaseModel):
    id: str
    user_id: str
    email: str | None
    rating_type: str
    score: int
    comment: str | None
    created_at: str


class PaginatedRatingList(BaseModel):
    ratings: list[RatingItem]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/ratings/overview", response_model=RatingOverview)
async def get_ratings_overview(
    db: AsyncClient = Depends(get_db),
) -> RatingOverview:
    """Return NPS and CSAT aggregated statistics."""
    try:
        result = (
            await db.table("ss_ratings")
            .select("rating_type, score")
            .execute()
        )
        rows = result.data or []

        nps_scores = [int(r["score"]) for r in rows if r.get("rating_type") == "nps"]
        csat_scores = [int(r["score"]) for r in rows if r.get("rating_type") == "csat"]

        nps_count = len(nps_scores)
        nps_avg = (sum(nps_scores) / nps_count) if nps_count > 0 else None

        # NPS score: % promoters (9-10) - % detractors (0-6)
        nps_score: float | None = None
        if nps_count > 0:
            promoters = sum(1 for s in nps_scores if s >= 9)
            detractors = sum(1 for s in nps_scores if s <= 6)
            nps_score = round(((promoters - detractors) / nps_count) * 100, 1)

        csat_count = len(csat_scores)
        csat_avg = (sum(csat_scores) / csat_count) if csat_count > 0 else None

    except Exception as exc:
        logger.exception("Ratings overview query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取评分概览失败")

    return RatingOverview(
        nps_count=nps_count,
        nps_avg=round(nps_avg, 2) if nps_avg is not None else None,
        nps_score=nps_score,
        csat_count=csat_count,
        csat_avg=round(csat_avg, 2) if csat_avg is not None else None,
    )


@router.get("/ratings/details", response_model=PaginatedRatingList)
async def get_ratings_details(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    rating_type: str | None = Query(default=None),
    db: AsyncClient = Depends(get_db),
) -> PaginatedRatingList:
    """Return paginated rating details."""
    try:
        query = db.table("ss_ratings").select(
            "id, user_id, rating_type, score, comment, created_at",
            count="exact",
        )
        if rating_type is not None:
            query = query.eq("rating_type", rating_type)

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        result = await query.execute()
        rows = result.data or []
        total = result.count or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        ratings = [
            RatingItem(
                id=row["id"],
                user_id=row["user_id"],
                email=None,  # No JOIN in this query for performance
                rating_type=row["rating_type"],
                score=int(row["score"]),
                comment=row.get("comment"),
                created_at=str(row["created_at"]),
            )
            for row in rows
        ]

    except Exception as exc:
        logger.exception("Ratings details query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取评分详情失败")

    return PaginatedRatingList(
        ratings=ratings,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )
