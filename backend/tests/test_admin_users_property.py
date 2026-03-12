# -*- coding: utf-8 -*-
"""
Property-Based Tests: 用户搜索和筛选属性测试
Feature: admin-panel

Properties:
  P7: Membership uses underscore format — Validates: Requirements 8.2, 8.3, 8.6
  Additional: Pagination validation, response structure
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Stub out 'supabase' before any app module is imported
# (same pattern as test_admin_dashboard_property.py)
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
    with patch("app.api.admin_users.queue_audit_log"):
        yield

# ---------------------------------------------------------------------------
# JWT helper — create a valid admin token for bypassing middleware
# ---------------------------------------------------------------------------

JWT_SECRET = TEST_JWT_SECRET

VALID_TIERS = {"free", "pro", "pro_plus", "ultra"}


def _make_admin_client(token: str, *, raise_server_exceptions: bool) -> TestClient:
    return make_client_with_cookie(
        app,
        "admin_token",
        token,
        raise_server_exceptions=raise_server_exceptions,
    )


def _make_admin_token() -> str:
    """Create a valid admin JWT token for test requests."""
    payload = {
        "sub": "test-admin-id",
        "username": "testadmin",
        "type": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=4),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


# ---------------------------------------------------------------------------
# DB mock factory — returns empty list for user_profiles queries
# ---------------------------------------------------------------------------

def _make_users_db_mock() -> AsyncMock:
    """
    Build a mock Supabase AsyncClient that returns empty data for all
    user_profiles queries.

    Handles the full filter chain:
      db.table("user_profiles")
        .select(..., count="exact")
        .ilike(...)   [optional]
        .eq(...)      [optional]
        .gte(...)     [optional]
        .lte(...)     [optional]
        .order(...)
        .range(...)
        .execute()    → count=0, data=[]
    """
    mock_db = MagicMock()

    def _make_chain(count=0, data=None):
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        # All filter methods return the same chain (fluent interface)
        chain.ilike = MagicMock(return_value=chain)
        chain.eq = MagicMock(return_value=chain)
        chain.gte = MagicMock(return_value=chain)
        chain.lte = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.range = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        chain.maybe_single = MagicMock(return_value=chain)
        chain.limit = MagicMock(return_value=chain)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        chain = _make_chain(count=0, data=[])
        tbl.select = MagicMock(return_value=chain)
        tbl.update = MagicMock(return_value=chain)
        tbl.insert = MagicMock(return_value=chain)
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Property 7: Membership uses underscore format
# Validates: Requirements 8.2, 8.3, 8.6
# ---------------------------------------------------------------------------

_valid_tier_st = st.sampled_from(sorted(VALID_TIERS))


@given(tier=_valid_tier_st)
@hyp_settings(max_examples=20)
def test_p7_valid_tier_returns_200(tier: str):
    """
    **Validates: Requirements 8.2, 8.3, 8.6**

    Property 7: Membership uses underscore format
    For any valid tier value in {"free", "pro", "pro_plus", "ultra"},
    GET /api/admin/users?tier=X should:
      1. Return 200 (not 422)
      2. The tier filter is accepted as a valid query parameter
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/users?tier={tier}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, (
        f"Expected 200 for valid tier={tier!r}, "
        f"got {response.status_code}: {response.text}"
    )


@given(tier=_valid_tier_st)
@hyp_settings(max_examples=20)
def test_p7_valid_tier_response_has_required_fields(tier: str):
    """
    **Validates: Requirements 8.6**

    Property 7 (response structure): For any valid tier, the response must
    contain: users (list), total (int), page (int), page_size (int), total_pages (int).
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/users?tier={tier}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    assert isinstance(body.get("users"), list), (
        f"Expected 'users' to be a list, got: {type(body.get('users'))}"
    )
    assert isinstance(body.get("total"), int), (
        f"Expected 'total' to be an int, got: {type(body.get('total'))}"
    )
    assert isinstance(body.get("page"), int), (
        f"Expected 'page' to be an int, got: {type(body.get('page'))}"
    )
    assert isinstance(body.get("page_size"), int), (
        f"Expected 'page_size' to be an int, got: {type(body.get('page_size'))}"
    )
    assert isinstance(body.get("total_pages"), int), (
        f"Expected 'total_pages' to be an int, got: {type(body.get('total_pages'))}"
    )


# Invalid tier values (not in the underscore-format set) should return 422
_invalid_tier_st = st.text(
    alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=20,
).filter(lambda s: s.strip() not in VALID_TIERS and s.strip() != "")


@given(invalid_tier=_invalid_tier_st)
@hyp_settings(max_examples=20)
def test_p7_invalid_tier_returns_422(invalid_tier: str):
    """
    **Validates: Requirements 8.3, 8.6**

    Property 7 (invalid input): Any tier value NOT in {"free", "pro", "pro_plus", "ultra"}
    (e.g., "Pro+", "PRO", "premium") should return 422.
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get(
            f"/api/admin/users?tier={invalid_tier}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for invalid tier={invalid_tier!r}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Pagination validation properties
# Validates: Requirements 8.6
# ---------------------------------------------------------------------------

_valid_page_st = st.integers(min_value=1, max_value=1000)
_valid_page_size_st = st.integers(min_value=1, max_value=100)


@given(page=_valid_page_st, page_size=_valid_page_size_st)
@hyp_settings(max_examples=20)
def test_pagination_valid_params_return_200(page: int, page_size: int):
    """
    **Validates: Requirements 8.6**

    For any valid page (>= 1) and page_size (1-100),
    GET /api/admin/users should return 200.
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/users?page={page}&page_size={page_size}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, (
        f"Expected 200 for page={page}, page_size={page_size}, "
        f"got {response.status_code}: {response.text}"
    )


@given(page=_valid_page_st, page_size=_valid_page_size_st)
@hyp_settings(max_examples=20)
def test_pagination_response_echoes_params(page: int, page_size: int):
    """
    **Validates: Requirements 8.6**

    The response must echo back the requested page and page_size values.
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/users?page={page}&page_size={page_size}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["page"] == page, (
        f"Expected page={page} echoed, got {body['page']}"
    )
    assert body["page_size"] == page_size, (
        f"Expected page_size={page_size} echoed, got {body['page_size']}"
    )


_invalid_page_st = st.integers(max_value=0)


@given(page=_invalid_page_st)
@hyp_settings(max_examples=20)
def test_pagination_invalid_page_returns_422(page: int):
    """
    **Validates: Requirements 8.6**

    Invalid page (0 or negative) should return 422.
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get(
            f"/api/admin/users?page={page}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for invalid page={page}, "
        f"got {response.status_code}: {response.text}"
    )


_invalid_page_size_st = st.one_of(
    st.integers(max_value=0),
    st.integers(min_value=101),
)


@given(page_size=_invalid_page_size_st)
@hyp_settings(max_examples=20)
def test_pagination_invalid_page_size_returns_422(page_size: int):
    """
    **Validates: Requirements 8.6**

    Invalid page_size (0, negative, or > 100) should return 422.
    """
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get(
            f"/api/admin/users?page_size={page_size}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for invalid page_size={page_size}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Baseline unit tests (non-property)
# ---------------------------------------------------------------------------

def test_users_list_returns_200_no_filters():
    """GET /api/admin/users with no filters returns 200 with pagination structure."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/users")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["users"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert body["total_pages"] == 1


def test_users_list_without_token_returns_401():
    """GET /api/admin/users without admin_token returns 401."""
    mock_db = _make_users_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/users")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_tier_free_returns_200():
    """GET /api/admin/users?tier=free returns 200."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/users?tier=free")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200


def test_tier_pro_plus_underscore_returns_200():
    """GET /api/admin/users?tier=pro_plus (underscore format) returns 200."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/users?tier=pro_plus")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200


def test_tier_pro_plus_symbol_returns_422():
    """GET /api/admin/users?tier=Pro+ (symbol format) returns 422."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get("/api/admin/users?tier=Pro%2B")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422


def test_tier_uppercase_pro_returns_422():
    """GET /api/admin/users?tier=PRO (uppercase) returns 422."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get("/api/admin/users?tier=PRO")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422


def test_tier_premium_returns_422():
    """GET /api/admin/users?tier=premium (unknown tier) returns 422."""
    mock_db = _make_users_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get("/api/admin/users?tier=premium")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422
