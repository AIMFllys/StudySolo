"""Pydantic models for Notice management API."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator

NoticeType = Literal["system", "feature", "maintenance", "promotion"]
NoticeStatus = Literal["draft", "published", "archived"]


class NoticeCreate(BaseModel):
    title: str
    content: str
    type: NoticeType
    status: NoticeStatus = "draft"
    expires_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("标题不能为空")
        if len(v) > 200:
            raise ValueError("标题不能超过 200 个字符")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError("内容不能为空")
        if len(v) > 10000:
            raise ValueError("内容不能超过 10000 个字符")
        return v

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return v
        from datetime import timezone
        now = datetime.now(timezone.utc)
        # Ensure timezone-aware comparison
        if v.tzinfo is None:
            from datetime import timezone
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("expires_at 必须是未来的时间")
        return v


class NoticeUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    type: NoticeType | None = None
    status: NoticeStatus | None = None
    expires_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 1:
            raise ValueError("标题不能为空")
        if len(v) > 200:
            raise ValueError("标题不能超过 200 个字符")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 1:
            raise ValueError("内容不能为空")
        if len(v) > 10000:
            raise ValueError("内容不能超过 10000 个字符")
        return v

    @field_validator("expires_at")
    @classmethod
    def validate_expires_at(cls, v: datetime | None) -> datetime | None:
        if v is None:
            return v
        from datetime import timezone
        now = datetime.now(timezone.utc)
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= now:
            raise ValueError("expires_at 必须是未来的时间")
        return v


class NoticeItem(BaseModel):
    id: str
    title: str
    content: str
    type: str
    status: str
    created_by: str | None
    created_at: str
    published_at: str | None
    expires_at: str | None


class NoticeDetail(NoticeItem):
    read_count: int


class PaginatedNoticeList(BaseModel):
    notices: list[NoticeItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class DeleteResponse(BaseModel):
    success: bool
    notice_id: str


class PublishResponse(BaseModel):
    success: bool
    notice_id: str
    published_at: str
