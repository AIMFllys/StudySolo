# -*- coding: utf-8 -*-
"""
Property-Based Tests: 公告验证属性测试
Feature: admin-panel

Properties:
  P8: Notice validation — title 1-200 chars, content 1-10000 chars,
      type enum, expires_at future
  Validates: Requirements 9.7
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Stub out 'supabase' before any app module is imported
# ---------------------------------------------------------------------------

def _install_supabase_stub():
    if "supabase" not in sys.modules:
        stub = ModuleType("supabase")
        stub.AsyncClient = object  # type: ignore[attr-defined]
        stub.create_async_client = AsyncMock()  # type: ignore[attr-defined]
        sys.modules["supabase"] = stub

    for sub in ("supabase._async", "supabase._async.client", "supabase.lib"):
        if sub not in sys.modules:
            sys.modules[sub] = ModuleType(sub)

    async_client_mod = sys.modules["supabase._async.client"]
    if not hasattr(async_client_mod, "AsyncClient"):
        async_client_mod.AsyncClient = object  # type: ignore[attr-defined]


_install_supabase_stub()

import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient
from hypothesis import given, settings as hyp_settings
from hypothesis import strategies as st
from jose import jwt
import pytest
from tests._helpers import TEST_JWT_SECRET, make_client_with_cookie

os.environ.setdefault("JWT_SECRET", TEST_JWT_SECRET)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("ENVIRONMENT", "development")

from app.main import app  # noqa: E402
from app.core.database import get_db  # noqa: E402


@pytest.fixture(autouse=True)
def _disable_audit_queue():
    with patch("app.api.admin_notices.queue_audit_log"):
        yield

# ---------------------------------------------------------------------------
# JWT helper
# ---------------------------------------------------------------------------

JWT_SECRET = TEST_JWT_SECRET

VALID_TYPES = {"system", "feature", "maintenance", "promotion"}
VALID_STATUSES = {"draft", "published", "archived"}


def _make_admin_client(token: str, *, raise_server_exceptions: bool) -> TestClient:
    return make_client_with_cookie(
        app,
        "admin_token",
        token,
        raise_server_exceptions=raise_server_exceptions,
    )


def _make_admin_token() -> str:
    payload = {
        "sub": "test-admin-id",
        "username": "testadmin",
        "type": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=4),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ---------------------------------------------------------------------------
# DB mock factory — returns a created notice row on insert
# ---------------------------------------------------------------------------

def _make_notices_db_mock(notice_id: str | None = None) -> AsyncMock:
    """
    Build a mock Supabase AsyncClient for notice CRUD operations.
    Handles: insert, select, update, delete with full fluent chain.
    """
    mock_db = MagicMock()
    _id = notice_id or str(uuid.uuid4())

    def _make_chain(count=0, data=None):
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        chain.eq = MagicMock(return_value=chain)
        chain.ilike = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.range = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        chain.maybe_single = MagicMock(return_value=chain)
        chain.limit = MagicMock(return_value=chain)
        chain.delete = MagicMock(return_value=chain)
        chain.update = MagicMock(return_value=chain)
        return chain

    def _make_insert_chain(title: str = "Test", content: str = "Body",
                           notice_type: str = "system", status: str = "draft"):
        row = {
            "id": _id,
            "title": title,
            "content": content,
            "type": notice_type,
            "status": status,
            "created_by": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "published_at": None,
            "expires_at": None,
        }
        result = MagicMock()
        result.count = 1
        result.data = [row]

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        if table_name == "ss_notices":
            tbl.select = MagicMock(return_value=_make_chain(count=0, data=[]))
            tbl.insert = MagicMock(return_value=_make_insert_chain())
            tbl.update = MagicMock(return_value=_make_chain(count=0, data=[]))
            tbl.delete = MagicMock(return_value=_make_chain())
        elif table_name == "ss_notice_reads":
            tbl.select = MagicMock(return_value=_make_chain(count=0, data=[]))
        else:
            tbl.select = MagicMock(return_value=_make_chain())
            tbl.insert = MagicMock(return_value=_make_chain())
            tbl.update = MagicMock(return_value=_make_chain())
            tbl.delete = MagicMock(return_value=_make_chain())
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Valid title: 1-200 chars (non-empty after strip)
_valid_title_st = st.text(
    alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=200,
).filter(lambda s: len(s.strip()) >= 1)

# Valid content: 1-10000 chars (non-empty after strip)
_valid_content_st = st.text(
    alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=200,  # keep short for speed; boundary tested separately
).filter(lambda s: len(s.strip()) >= 1)

_valid_type_st = st.sampled_from(sorted(VALID_TYPES))
_valid_status_st = st.sampled_from(sorted(VALID_STATUSES))

# Future datetime (ISO string)
_future_dt_st = st.datetimes(
    min_value=datetime(2026, 1, 1),
    max_value=datetime(2099, 12, 31),
    timezones=st.just(timezone.utc),
).map(lambda d: d.isoformat())


# ---------------------------------------------------------------------------
# Property 8a: Valid notice creation returns 201
# Validates: Requirements 9.7
# ---------------------------------------------------------------------------

@given(title=_valid_title_st, content=_valid_content_st, notice_type=_valid_type_st)
@hyp_settings(max_examples=20)
def test_p8_valid_notice_create_returns_201(title: str, content: str, notice_type: str):
    """
    **Validates: Requirements 9.7**

    Property 8a: For any valid title (1-200 chars), content (1-10000 chars),
    and type in {system, feature, maintenance, promotion},
    POST /api/admin/notices should return 201.
    """
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.post(
            "/api/admin/notices",
            json={"title": title, "content": content, "type": notice_type},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201, (
        f"Expected 201 for valid notice, got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Property 8b: Invalid type returns 422
# Validates: Requirements 9.7
# ---------------------------------------------------------------------------

_invalid_type_st = st.text(
    alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=20,
).filter(lambda s: s.strip() not in VALID_TYPES and s.strip() != "")


@given(invalid_type=_invalid_type_st)
@hyp_settings(max_examples=20)
def test_p8_invalid_type_returns_422(invalid_type: str):
    """
    **Validates: Requirements 9.7**

    Property 8b: Any type value NOT in {system, feature, maintenance, promotion}
    should return 422.
    """
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": "Test", "content": "Body", "type": invalid_type},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for invalid type={invalid_type!r}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Property 8c: Title length boundary
# Validates: Requirements 9.7
# ---------------------------------------------------------------------------

@given(extra=st.integers(min_value=1, max_value=100))
@hyp_settings(max_examples=20)
def test_p8_title_too_long_returns_422(extra: int):
    """
    **Validates: Requirements 9.7**

    Property 8c: Title longer than 200 chars should return 422.
    """
    long_title = "a" * (200 + extra)
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": long_title, "content": "Body", "type": "system"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for title length {len(long_title)}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Property 8d: Content length boundary
# Validates: Requirements 9.7
# ---------------------------------------------------------------------------

@given(extra=st.integers(min_value=1, max_value=100))
@hyp_settings(max_examples=20)
def test_p8_content_too_long_returns_422(extra: int):
    """
    **Validates: Requirements 9.7**

    Property 8d: Content longer than 10000 chars should return 422.
    """
    long_content = "a" * (10000 + extra)
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": "Test", "content": long_content, "type": "system"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for content length {len(long_content)}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Property 8e: expires_at must be in the future
# Validates: Requirements 9.7
# ---------------------------------------------------------------------------

@given(days_ago=st.integers(min_value=1, max_value=365))
@hyp_settings(max_examples=20)
def test_p8_past_expires_at_returns_422(days_ago: int):
    """
    **Validates: Requirements 9.7**

    Property 8e: expires_at in the past should return 422.
    """
    past_dt = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": "Test", "content": "Body", "type": "system", "expires_at": past_dt},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for past expires_at={past_dt!r}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Baseline unit tests
# ---------------------------------------------------------------------------

def test_notices_list_returns_200():
    """GET /api/admin/notices returns 200 with pagination structure."""
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/notices")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert "notices" in body
    assert "total" in body
    assert "page" in body
    assert "total_pages" in body


def test_notices_list_without_token_returns_401():
    """GET /api/admin/notices without admin_token returns 401."""
    mock_db = _make_notices_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/notices")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_create_notice_valid_returns_201():
    """POST /api/admin/notices with valid data returns 201."""
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.post(
            "/api/admin/notices",
            json={"title": "Test Notice", "content": "Hello world", "type": "system"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 201
    body = response.json()
    assert "id" in body
    assert "title" in body
    assert body["type"] == "system"
    assert body["status"] == "draft"
    assert body["read_count"] == 0


def test_create_notice_empty_title_returns_422():
    """POST /api/admin/notices with empty title returns 422."""
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": "   ", "content": "Body", "type": "system"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422


def test_create_notice_invalid_type_returns_422():
    """POST /api/admin/notices with invalid type returns 422."""
    mock_db = _make_notices_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/notices",
            json={"title": "Test", "content": "Body", "type": "unknown"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422


def test_delete_notice_without_token_returns_401():
    """DELETE /api/admin/notices/{id} without token returns 401."""
    mock_db = _make_notices_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.delete(f"/api/admin/notices/{uuid.uuid4()}")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401
