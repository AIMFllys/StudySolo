"""Service helpers for community shared nodes."""

from __future__ import annotations

import logging
import re
from math import ceil

from fastapi import HTTPException, status
from supabase import AsyncClient

from app.models.community_nodes import (
    CommunityNodeCreate,
    CommunityNodeListResponse,
    CommunityNodeMine,
    CommunityNodePublic,
)

logger = logging.getLogger(__name__)

_PUBLIC_COLS = (
    "id,author_id,name,description,icon,category,version,input_hint,"
    "output_format,output_schema,model_preference,knowledge_file_name,"
    "knowledge_file_size,likes_count,install_count,created_at"
)

_MINE_COLS = (
    _PUBLIC_COLS
    + ",prompt,status,reject_reason,knowledge_file_path,knowledge_text,is_public"
)


def _sanitize_search(search: str | None) -> str | None:
    if not search:
        return None
    safe = re.sub(r"[.,()\\%]", "", search).strip()
    return safe or None


async def _load_author_names(db: AsyncClient, author_ids: list[str]) -> dict[str, str]:
    if not author_ids:
        return {}
    profiles = (
        await db.from_("user_profiles")
        .select("id,nickname,email")
        .in_("id", author_ids)
        .execute()
    )
    name_map: dict[str, str] = {}
    for row in profiles.data or []:
        display_name = row.get("nickname") or row.get("email") or "未知用户"
        name_map[str(row["id"])] = str(display_name)
    return name_map


async def _load_liked_ids(
    db: AsyncClient,
    *,
    current_user_id: str | None,
    node_ids: list[str],
) -> set[str]:
    if not current_user_id or not node_ids:
        return set()
    result = (
        await db.from_("ss_community_node_likes")
        .select("node_id")
        .eq("user_id", current_user_id)
        .in_("node_id", node_ids)
        .execute()
    )
    return {str(row["node_id"]) for row in (result.data or [])}


def _serialize_public(
    row: dict,
    *,
    author_name: str,
    is_liked: bool,
    is_owner: bool,
) -> CommunityNodePublic:
    return CommunityNodePublic(
        id=str(row["id"]),
        author_id=str(row["author_id"]),
        author_name=author_name,
        name=str(row.get("name") or ""),
        description=str(row.get("description") or ""),
        icon=str(row.get("icon") or "Bot"),
        category=str(row.get("category") or "other"),
        version=str(row.get("version") or "1.0.0"),
        input_hint=str(row.get("input_hint") or ""),
        output_format=str(row.get("output_format") or "markdown"),
        output_schema=row.get("output_schema"),
        model_preference=str(row.get("model_preference") or "auto"),
        knowledge_file_name=row.get("knowledge_file_name"),
        knowledge_file_size=int(row.get("knowledge_file_size") or 0),
        likes_count=int(row.get("likes_count") or 0),
        install_count=int(row.get("install_count") or 0),
        is_liked=is_liked,
        is_owner=is_owner,
        created_at=row["created_at"],
    )


def _serialize_mine(row: dict, *, author_name: str, is_liked: bool) -> CommunityNodeMine:
    public = _serialize_public(
        row,
        author_name=author_name,
        is_liked=is_liked,
        is_owner=True,
    )
    return CommunityNodeMine(
        **public.model_dump(),
        prompt=str(row.get("prompt") or ""),
        status=str(row.get("status") or "approved"),
        reject_reason=row.get("reject_reason"),
    )


async def list_public_nodes(
    db: AsyncClient,
    *,
    page: int = 1,
    per_page: int = 10,
    sort: str = "likes",
    category: str | None = None,
    search: str | None = None,
    current_user_id: str | None = None,
) -> CommunityNodeListResponse:
    safe_search = _sanitize_search(search)
    query = (
        db.from_("ss_community_nodes")
        .select(_PUBLIC_COLS, count="exact")
        .eq("is_public", True)
    )
    if category:
        query = query.eq("category", category)
    if safe_search:
        query = query.or_(f"name.ilike.%{safe_search}%,description.ilike.%{safe_search}%")

    order_col = "created_at" if sort == "newest" else "likes_count"
    offset = (page - 1) * per_page
    result = (
        await query.order(order_col, desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    )
    rows = result.data or []
    author_names = await _load_author_names(db, [str(row["author_id"]) for row in rows])
    liked_ids = await _load_liked_ids(
        db,
        current_user_id=current_user_id,
        node_ids=[str(row["id"]) for row in rows],
    )
    items = [
        _serialize_public(
            row,
            author_name=author_names.get(str(row["author_id"]), "未知用户"),
            is_liked=str(row["id"]) in liked_ids,
            is_owner=current_user_id == str(row["author_id"]),
        )
        for row in rows
    ]
    total = int(getattr(result, "count", 0) or 0)
    pages = max(1, ceil(total / per_page)) if total else 1
    return CommunityNodeListResponse(items=items, total=total, page=page, pages=pages)


async def list_my_nodes(db: AsyncClient, *, user_id: str) -> list[CommunityNodeMine]:
    result = (
        await db.from_("ss_community_nodes")
        .select(_MINE_COLS)
        .eq("author_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []
    liked_ids = await _load_liked_ids(
        db,
        current_user_id=user_id,
        node_ids=[str(row["id"]) for row in rows],
    )
    return [
        _serialize_mine(row, author_name="我", is_liked=str(row["id"]) in liked_ids)
        for row in rows
    ]


async def get_my_node(
    db: AsyncClient,
    *,
    node_id: str,
    user_id: str,
) -> CommunityNodeMine:
    result = (
        await db.from_("ss_community_nodes")
        .select(_MINE_COLS)
        .eq("id", node_id)
        .eq("author_id", user_id)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或无权访问",
        )
    liked_ids = await _load_liked_ids(
        db,
        current_user_id=user_id,
        node_ids=[node_id],
    )
    return _serialize_mine(
        result.data,
        author_name="我",
        is_liked=node_id in liked_ids,
    )


async def get_public_node(
    db: AsyncClient,
    *,
    node_id: str,
    current_user_id: str | None = None,
) -> CommunityNodePublic:
    result = (
        await db.from_("ss_community_nodes")
        .select(_PUBLIC_COLS)
        .eq("id", node_id)
        .eq("is_public", True)
        .maybe_single()
        .execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或未公开",
        )
    row = result.data
    author_names = await _load_author_names(db, [str(row["author_id"])])
    liked_ids = await _load_liked_ids(
        db,
        current_user_id=current_user_id,
        node_ids=[str(row["id"])],
    )
    return _serialize_public(
        row,
        author_name=author_names.get(str(row["author_id"]), "未知用户"),
        is_liked=str(row["id"]) in liked_ids,
        is_owner=current_user_id == str(row["author_id"]),
    )


async def create_node(
    db: AsyncClient,
    *,
    author_id: str,
    payload: CommunityNodeCreate,
    knowledge_file_path: str | None = None,
    knowledge_file_name: str | None = None,
    knowledge_file_size: int = 0,
    knowledge_text: str | None = None,
) -> CommunityNodeMine:
    insert_payload = {
        "author_id": author_id,
        "name": payload.name,
        "description": payload.description,
        "icon": payload.icon,
        "category": payload.category,
        "prompt": payload.prompt,
        "input_hint": payload.input_hint,
        "output_format": payload.output_format,
        "output_schema": payload.output_schema,
        "model_preference": payload.model_preference,
        "status": "approved",
        "is_public": True,
        "knowledge_file_path": knowledge_file_path,
        "knowledge_file_name": knowledge_file_name,
        "knowledge_file_size": knowledge_file_size,
        "knowledge_text": knowledge_text,
    }
    result = await db.from_("ss_community_nodes").insert(insert_payload).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="发布社区节点失败",
        )
    row = result.data[0]
    return _serialize_mine(row, author_name="我", is_liked=False)


async def update_node(
    db: AsyncClient,
    *,
    node_id: str,
    author_id: str,
    updates: dict,
) -> CommunityNodeMine:
    result = (
        await db.from_("ss_community_nodes")
        .update(updates)
        .eq("id", node_id)
        .eq("author_id", author_id)
        .execute()
    )
    if result.data is not None and len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或无权修改",
        )
    fetch = (
        await db.from_("ss_community_nodes")
        .select(_MINE_COLS)
        .eq("id", node_id)
        .eq("author_id", author_id)
        .maybe_single()
        .execute()
    )
    if not fetch.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或无权修改",
        )
    return _serialize_mine(fetch.data, author_name="我", is_liked=False)


async def delete_node(db: AsyncClient, *, node_id: str, author_id: str) -> None:
    existing = (
        await db.from_("ss_community_nodes")
        .select("knowledge_file_path")
        .eq("id", node_id)
        .eq("author_id", author_id)
        .maybe_single()
        .execute()
    )
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或无权删除",
        )

    result = (
        await db.from_("ss_community_nodes")
        .delete()
        .eq("id", node_id)
        .eq("author_id", author_id)
        .execute()
    )
    if result.data is not None and len(result.data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在或无权删除",
        )
    knowledge_file_path = existing.data.get("knowledge_file_path")
    if knowledge_file_path:
        try:
            await db.storage.from_("community-node-files").remove([knowledge_file_path])
        except Exception as exc:  # pragma: no cover - best effort cleanup
            logger.warning(
                "Failed to remove knowledge file for community node %s: %s",
                node_id,
                exc,
            )


async def like_node(db: AsyncClient, *, node_id: str, user_id: str) -> int:
    exists = (
        await db.from_("ss_community_node_likes")
        .select("node_id")
        .eq("node_id", node_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    if not exists.data:
        await db.from_("ss_community_node_likes").insert(
            {"node_id": node_id, "user_id": user_id}
        ).execute()
    row = (
        await db.from_("ss_community_nodes")
        .select("likes_count")
        .eq("id", node_id)
        .maybe_single()
        .execute()
    )
    if not row.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在",
        )
    return int(row.data.get("likes_count") or 0)


async def unlike_node(db: AsyncClient, *, node_id: str, user_id: str) -> int:
    await (
        db.from_("ss_community_node_likes")
        .delete()
        .eq("node_id", node_id)
        .eq("user_id", user_id)
        .execute()
    )
    row = (
        await db.from_("ss_community_nodes")
        .select("likes_count")
        .eq("id", node_id)
        .maybe_single()
        .execute()
    )
    if not row.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="社区节点不存在",
        )
    return int(row.data.get("likes_count") or 0)


async def get_node_with_prompt(db: AsyncClient, *, node_id: str) -> dict | None:
    result = (
        await db.from_("ss_community_nodes")
        .select(
            "id,name,prompt,input_hint,output_format,output_schema,model_preference,"
            "knowledge_text,is_public,status"
        )
        .eq("id", node_id)
        .eq("is_public", True)
        .maybe_single()
        .execute()
    )
    return result.data
