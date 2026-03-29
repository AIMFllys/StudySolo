"""Community node query helpers — serialization, listing, and detail retrieval."""

from __future__ import annotations

import logging
import re
from math import ceil

from fastapi import HTTPException, status
from supabase import AsyncClient

from app.models.community_nodes import (
    CommunityNodeListResponse,
    CommunityNodeMine,
    CommunityNodePublic,
)

logger = logging.getLogger(__name__)

PUBLIC_COLS = (
    "id,author_id,name,description,icon,category,version,input_hint,"
    "output_format,output_schema,model_preference,knowledge_file_name,"
    "knowledge_file_size,likes_count,install_count,created_at"
)

MINE_COLS = PUBLIC_COLS + ",prompt,status,reject_reason,knowledge_file_path,knowledge_text,is_public"


def sanitize_search(search: str | None) -> str | None:
    if not search:
        return None
    safe = re.sub(r"[.,()\\%]", "", search).strip()
    return safe or None


async def load_author_names(db: AsyncClient, author_ids: list[str]) -> dict[str, str]:
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
        name_map[str(row["id"])] = str(row.get("nickname") or row.get("email") or "未知用户")
    return name_map


async def load_liked_ids(db: AsyncClient, *, current_user_id: str | None, node_ids: list[str]) -> set[str]:
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


def serialize_public(row: dict, *, author_name: str, is_liked: bool, is_owner: bool) -> CommunityNodePublic:
    return CommunityNodePublic(
        id=str(row["id"]), author_id=str(row["author_id"]), author_name=author_name,
        name=str(row.get("name") or ""), description=str(row.get("description") or ""),
        icon=str(row.get("icon") or "Bot"), category=str(row.get("category") or "other"),
        version=str(row.get("version") or "1.0.0"), input_hint=str(row.get("input_hint") or ""),
        output_format=str(row.get("output_format") or "markdown"),
        output_schema=row.get("output_schema"),
        model_preference=str(row.get("model_preference") or "auto"),
        knowledge_file_name=row.get("knowledge_file_name"),
        knowledge_file_size=int(row.get("knowledge_file_size") or 0),
        likes_count=int(row.get("likes_count") or 0),
        install_count=int(row.get("install_count") or 0),
        is_liked=is_liked, is_owner=is_owner, created_at=row["created_at"],
    )


def serialize_mine(row: dict, *, author_name: str, is_liked: bool) -> CommunityNodeMine:
    public = serialize_public(row, author_name=author_name, is_liked=is_liked, is_owner=True)
    return CommunityNodeMine(
        **public.model_dump(),
        prompt=str(row.get("prompt") or ""),
        status=str(row.get("status") or "approved"),
        reject_reason=row.get("reject_reason"),
    )


async def list_public_nodes(
    db: AsyncClient, *, page: int = 1, per_page: int = 10, sort: str = "likes",
    category: str | None = None, search: str | None = None, current_user_id: str | None = None,
) -> CommunityNodeListResponse:
    safe_search = sanitize_search(search)
    query = db.from_("ss_community_nodes").select(PUBLIC_COLS, count="exact").eq("is_public", True)
    if category:
        query = query.eq("category", category)
    if safe_search:
        query = query.or_(f"name.ilike.%{safe_search}%,description.ilike.%{safe_search}%")

    order_col = "created_at" if sort == "newest" else "likes_count"
    offset = (page - 1) * per_page
    result = await query.order(order_col, desc=True).range(offset, offset + per_page - 1).execute()
    rows = result.data or []
    author_names = await load_author_names(db, [str(r["author_id"]) for r in rows])
    liked_ids = await load_liked_ids(db, current_user_id=current_user_id, node_ids=[str(r["id"]) for r in rows])
    items = [
        serialize_public(r, author_name=author_names.get(str(r["author_id"]), "未知用户"),
                         is_liked=str(r["id"]) in liked_ids, is_owner=current_user_id == str(r["author_id"]))
        for r in rows
    ]
    total = int(getattr(result, "count", 0) or 0)
    pages = max(1, ceil(total / per_page)) if total else 1
    return CommunityNodeListResponse(items=items, total=total, page=page, pages=pages)


async def list_my_nodes(db: AsyncClient, *, user_id: str) -> list[CommunityNodeMine]:
    result = (
        await db.from_("ss_community_nodes").select(MINE_COLS)
        .eq("author_id", user_id).order("created_at", desc=True).execute()
    )
    rows = result.data or []
    liked_ids = await load_liked_ids(db, current_user_id=user_id, node_ids=[str(r["id"]) for r in rows])
    return [serialize_mine(r, author_name="我", is_liked=str(r["id"]) in liked_ids) for r in rows]


async def get_my_node(db: AsyncClient, *, node_id: str, user_id: str) -> CommunityNodeMine:
    result = (
        await db.from_("ss_community_nodes").select(MINE_COLS)
        .eq("id", node_id).eq("author_id", user_id).maybe_single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="社区节点不存在或无权访问")
    liked_ids = await load_liked_ids(db, current_user_id=user_id, node_ids=[node_id])
    return serialize_mine(result.data, author_name="我", is_liked=node_id in liked_ids)


async def get_public_node(db: AsyncClient, *, node_id: str, current_user_id: str | None = None) -> CommunityNodePublic:
    result = (
        await db.from_("ss_community_nodes").select(PUBLIC_COLS)
        .eq("id", node_id).eq("is_public", True).maybe_single().execute()
    )
    if not result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="社区节点不存在或未公开")
    row = result.data
    author_names = await load_author_names(db, [str(row["author_id"])])
    liked_ids = await load_liked_ids(db, current_user_id=current_user_id, node_ids=[str(row["id"])])
    return serialize_public(
        row, author_name=author_names.get(str(row["author_id"]), "未知用户"),
        is_liked=str(row["id"]) in liked_ids, is_owner=current_user_id == str(row["author_id"]),
    )


async def get_node_with_prompt(db: AsyncClient, *, node_id: str) -> dict | None:
    result = (
        await db.from_("ss_community_nodes")
        .select("id,name,prompt,input_hint,output_format,output_schema,model_preference,knowledge_text,is_public,status")
        .eq("id", node_id).eq("is_public", True).maybe_single().execute()
    )
    return result.data
