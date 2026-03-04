from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, field_validator

T = TypeVar("T")

SPECIAL_CHARS = set("!@#$%^&*()_+-=[]{}|;':\",./<>?")


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminProfile(BaseModel):
    id: str
    username: str
    force_change_password: bool


class AdminLoginResponse(BaseModel):
    success: bool
    admin: AdminProfile


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        errors = []
        if len(v) < 12:
            errors.append("密码长度至少 12 个字符")
        if not any(c.isupper() for c in v):
            errors.append("密码必须包含至少一个大写字母")
        if not any(c.islower() for c in v):
            errors.append("密码必须包含至少一个小写字母")
        if not any(c.isdigit() for c in v):
            errors.append("密码必须包含至少一个数字")
        if not any(c in SPECIAL_CHARS for c in v):
            errors.append("密码必须包含至少一个特殊字符 (!@#$%^&*()_+-=[]{}|;':\",./<>?)")
        if errors:
            raise ValueError("; ".join(errors))
        return v


class AuditLogEntry(BaseModel):
    id: str
    admin_id: str | None
    action: str
    target_type: str | None
    target_id: str | None
    details: dict | None
    ip_address: str | None
    user_agent: str | None
    created_at: datetime


class SystemConfigEntry(BaseModel):
    key: str
    value: dict
    description: str | None
    updated_by: str | None
    updated_at: datetime


class SystemConfigUpdate(BaseModel):
    value: dict
    description: str | None = None


class PaginationMeta(BaseModel):
    page: int
    per_page: int
    total: int
    total_pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: PaginationMeta
