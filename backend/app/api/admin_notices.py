"""Admin Notices API.

Endpoints:
  GET    /notices           — paginated list, filter by type/status
  GET    /notices/{id}      — single notice detail + read_count
  POST   /notices           — create notice
  PUT    /notices/{id}      — update notice
  DELETE /notices/{id}      — delete notice (only if status='draft')
  POST   /notices/{id}/publish — publish notice
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from supabase._async.client import AsyncClient

from app.core.database import get_db
from app.models.notice import (
    DeleteResponse,
    NoticeCreate,
    NoticeDetail,
    NoticeItem,
    NoticeUpdate,
    PaginatedNoticeList,
    PublishResponse,
)
from app.services.audit_logger import get_client_info, log_action

logger = logging.getLogger(__name__)

router = APIRouter(tags=["admin-notices"])

NoticeTypeFilter = Literal["system", "feature", "maintenance", "promotion"]
NoticeStatusFilter = Literal["draft", "published", "archived"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _row_to_item(row: dict) -> NoticeItem:
    return NoticeItem(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        type=row["type"],
        status=row["status"],
        created_by=row.get("created_by"),
        created_at=str(row["created_at"]),
        published_at=str(row["published_at"]) if row.get("published_at") else None,
        expires_at=str(row["expires_at"]) if row.get("expires_at") else None,
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/notices", response_model=PaginatedNoticeList)
async def list_notices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    type: NoticeTypeFilter | None = Query(default=None),
    status: NoticeStatusFilter | None = Query(default=None),
    db: AsyncClient = Depends(get_db),
) -> PaginatedNoticeList:
    """Return paginated notice list with optional type/status filters."""
    try:
        query = db.table("ss_notices").select(
            "id, title, content, type, status, created_by, created_at, published_at, expires_at",
            count="exact",
        )

        if type is not None:
            query = query.eq("type", type)
        if status is not None:
            query = query.eq("status", status)

        offset = (page - 1) * page_size
        query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

        result = await query.execute()
        rows = result.data or []
        total = result.count or 0
        total_pages = max(1, (total + page_size - 1) // page_size)

        notices = [_row_to_item(row) for row in rows]

    except Exception as exc:
        logger.exception("Notice list query failed: %s", exc)
        raise HTTPException(status_code=500, detail="获取公告列表失败")

    return PaginatedNoticeList(
        notices=notices,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/notices/{notice_id}", response_model=NoticeDetail)
async def get_notice(
    notice_id: str,
    db: AsyncClient = Depends(get_db),
) -> NoticeDetail:
    """Return single notice detail with read count."""
    try:
        result = (
            await db.table("ss_notices")
            .select("id, title, content, type, status, created_by, created_at, published_at, expires_at")
            .eq("id", notice_id)
            .maybe_single()
            .execute()
        )
        row = result.data if result else None
        if not row:
            raise HTTPException(status_code=404, detail="公告不存在")

        # Count reads
        reads_result = (
            await db.table("ss_notice_reads")
            .select("id", count="exact")
            .eq("notice_id", notice_id)
            .execute()
        )
        read_count = reads_result.count or 0

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Notice detail query failed for %s: %s", notice_id, exc)
        raise HTTPException(status_code=500, detail="获取公告详情失败")

    return NoticeDetail(
        **_row_to_item(row).model_dump(),
        read_count=read_count,
    )


@router.post("/notices", response_model=NoticeDetail, status_code=201)
async def create_notice(
    body: NoticeCreate,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> NoticeDetail:
    """Create a new notice."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        record: dict = {
            "title": body.title,
            "content": body.content,
            "type": body.type,
            "status": body.status,
        }
        if admin_id:
            record["created_by"] = admin_id
        if body.expires_at:
            record["expires_at"] = body.expires_at.isoformat()

        result = await db.table("ss_notices").insert(record).execute()
        rows = result.data or []
        if not rows:
            raise HTTPException(status_code=500, detail="创建公告失败")

        new_row = rows[0]

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Notice create failed: %s", exc)
        raise HTTPException(status_code=500, detail="创建公告失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="notice_create",
            target_type="notice",
            target_id=new_row["id"],
            details={"title": body.title, "type": body.type, "status": body.status},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return NoticeDetail(**_row_to_item(new_row).model_dump(), read_count=0)


@router.put("/notices/{notice_id}", response_model=NoticeDetail)
async def update_notice(
    notice_id: str,
    body: NoticeUpdate,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> NoticeDetail:
    """Update an existing notice."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        # Verify notice exists
        existing_result = (
            await db.table("ss_notices")
            .select("id, title, content, type, status, created_by, created_at, published_at, expires_at")
            .eq("id", notice_id)
            .maybe_single()
            .execute()
        )
        existing = existing_result.data if existing_result else None
        if not existing:
            raise HTTPException(status_code=404, detail="公告不存在")

        # Build update payload from non-None fields
        updates: dict = {}
        if body.title is not None:
            updates["title"] = body.title
        if body.content is not None:
            updates["content"] = body.content
        if body.type is not None:
            updates["type"] = body.type
        if body.status is not None:
            updates["status"] = body.status
        if body.expires_at is not None:
            updates["expires_at"] = body.expires_at.isoformat()

        if not updates:
            # Nothing to update — return current state
            reads_result = (
                await db.table("ss_notice_reads")
                .select("id", count="exact")
                .eq("notice_id", notice_id)
                .execute()
            )
            return NoticeDetail(
                **_row_to_item(existing).model_dump(),
                read_count=reads_result.count or 0,
            )

        result = (
            await db.table("ss_notices")
            .update(updates)
            .eq("id", notice_id)
            .execute()
        )
        updated_rows = result.data or []
        updated_row = updated_rows[0] if updated_rows else existing

        # Read count
        reads_result = (
            await db.table("ss_notice_reads")
            .select("id", count="exact")
            .eq("notice_id", notice_id)
            .execute()
        )
        read_count = reads_result.count or 0

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Notice update failed for %s: %s", notice_id, exc)
        raise HTTPException(status_code=500, detail="更新公告失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="notice_update",
            target_type="notice",
            target_id=notice_id,
            details={"before": {k: existing.get(k) for k in updates}, "after": updates},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return NoticeDetail(**_row_to_item(updated_row).model_dump(), read_count=read_count)


@router.delete("/notices/{notice_id}", response_model=DeleteResponse)
async def delete_notice(
    notice_id: str,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> DeleteResponse:
    """Delete a notice. Only allowed when status='draft'."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        existing_result = (
            await db.table("ss_notices")
            .select("id, status, title")
            .eq("id", notice_id)
            .maybe_single()
            .execute()
        )
        existing = existing_result.data if existing_result else None
        if not existing:
            raise HTTPException(status_code=404, detail="公告不存在")

        if existing["status"] != "draft":
            raise HTTPException(status_code=400, detail="只能删除草稿状态的公告")

        await db.table("ss_notices").delete().eq("id", notice_id).execute()

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Notice delete failed for %s: %s", notice_id, exc)
        raise HTTPException(status_code=500, detail="删除公告失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="notice_delete",
            target_type="notice",
            target_id=notice_id,
            details={"title": existing.get("title")},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return DeleteResponse(success=True, notice_id=notice_id)


@router.post("/notices/{notice_id}/publish", response_model=PublishResponse)
async def publish_notice(
    notice_id: str,
    request: Request,
    db: AsyncClient = Depends(get_db),
) -> PublishResponse:
    """Publish a notice: set status='published' and published_at=now()."""
    ip_address, user_agent = get_client_info(request)
    admin_id: str | None = getattr(request.state, "admin_id", None)

    try:
        existing_result = (
            await db.table("ss_notices")
            .select("id, status")
            .eq("id", notice_id)
            .maybe_single()
            .execute()
        )
        existing = existing_result.data if existing_result else None
        if not existing:
            raise HTTPException(status_code=404, detail="公告不存在")

        now_iso = datetime.now(timezone.utc).isoformat()
        result = (
            await db.table("ss_notices")
            .update({"status": "published", "published_at": now_iso})
            .eq("id", notice_id)
            .execute()
        )
        updated_rows = result.data or []
        published_at = updated_rows[0]["published_at"] if updated_rows else now_iso

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Notice publish failed for %s: %s", notice_id, exc)
        raise HTTPException(status_code=500, detail="发布公告失败")

    asyncio.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action="notice_publish",
            target_type="notice",
            target_id=notice_id,
            details={"before_status": existing.get("status"), "after_status": "published"},
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )

    return PublishResponse(
        success=True,
        notice_id=notice_id,
        published_at=str(published_at),
    )
