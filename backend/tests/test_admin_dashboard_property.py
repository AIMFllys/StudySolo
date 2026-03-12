# -*- coding: utf-8 -*-
"""
Property-Based Tests: Dashboard API 属性测试
Feature: admin-panel

Properties:
  P18: Time range filter correctness — Validates: Requirements 7.4, 7.6
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock


# ---------------------------------------------------------------------------
# Stub out 'supabase' before any app module is imported
# (same pattern as test_admin_auth_property.py)
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
from tests._helpers import TEST_JWT_SECRET, make_client_with_cookie

os.environ.setdefault("JWT_SECRET", TEST_JWT_SECRET)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("ENVIRONMENT", "development")

from app.main import app  # noqa: E402
from app.core.database import get_db  # noqa: E402

# ---------------------------------------------------------------------------
# JWT helper — create a valid admin token for bypassing middleware
# ---------------------------------------------------------------------------

JWT_SECRET = TEST_JWT_SECRET


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
# DB mock factory — returns empty data for all dashboard queries
# ---------------------------------------------------------------------------

def _make_dashboard_db_mock() -> AsyncMock:
    """
    Build a mock Supabase AsyncClient that returns empty data for all
    dashboard-related table queries.

    Handles:
      - db.table("user_profiles").select(...).execute()           → count=0, data=[]
      - db.table("user_profiles").select(...).eq(...).execute()   → count=0, data=[]
      - db.table("subscriptions").select(...).eq(...).execute()   → count=0
      - db.table("ss_workflow_runs").select(...).execute()        → count=0
      - db.table("ss_workflow_runs").select(...).gte(...).lt(...).execute() → count=0
      - db.table("v_daily_signups").select(...).eq(...).maybe_single().execute() → data=None
      - db.table("v_daily_signups").select(...).gte(...).order(...).execute() → data=[]
      - db.table("v_daily_workflow_stats").select(...).gte(...).order(...).execute() → data=[]
    """
    mock_db = MagicMock()

    def _make_chain(count=0, data=None):
        """Create a fluent query chain mock returning the given count/data."""
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        chain.maybe_single = MagicMock(return_value=chain)
        chain.eq = MagicMock(return_value=chain)
        chain.gte = MagicMock(return_value=chain)
        chain.lt = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        if table_name == "v_daily_signups":
            # maybe_single() path returns data=None (no row for today)
            # list path returns data=[]
            chain = _make_chain(count=0, data=None)
            tbl.select = MagicMock(return_value=chain)
        elif table_name == "v_daily_workflow_stats":
            chain = _make_chain(count=0, data=[])
            tbl.select = MagicMock(return_value=chain)
        elif table_name == "user_profiles":
            chain = _make_chain(count=0, data=[])
            tbl.select = MagicMock(return_value=chain)
        elif table_name == "subscriptions":
            chain = _make_chain(count=0, data=[])
            tbl.select = MagicMock(return_value=chain)
        elif table_name == "ss_workflow_runs":
            chain = _make_chain(count=0, data=[])
            tbl.select = MagicMock(return_value=chain)
        else:
            chain = _make_chain(count=0, data=[])
            tbl.select = MagicMock(return_value=chain)
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Property 18: Time range filter correctness
# Validates: Requirements 7.4, 7.6
# ---------------------------------------------------------------------------

VALID_TIME_RANGES = ["7d", "30d", "90d"]

_valid_time_range_st = st.sampled_from(VALID_TIME_RANGES)


@given(time_range=_valid_time_range_st)
@hyp_settings(max_examples=20)
def test_p18_valid_time_range_returns_200_with_correct_echo(time_range: str):
    """
    **Validates: Requirements 7.4, 7.6**

    Property 18: Time range filter correctness
    For any valid time_range in {"7d", "30d", "90d"},
    GET /api/admin/dashboard/charts?time_range=X should:
      1. Return 200
      2. Echo back the correct time_range value in the response
      3. Return signups_chart and workflow_chart as lists (possibly empty)
    """
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/dashboard/charts?time_range={time_range}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, (
        f"Expected 200 for time_range={time_range!r}, "
        f"got {response.status_code}: {response.text}"
    )

    body = response.json()

    # The echoed time_range must match the requested one
    assert body.get("time_range") == time_range, (
        f"Expected time_range={time_range!r} echoed in response, "
        f"got: {body.get('time_range')!r}"
    )

    # signups_chart must be a list
    assert isinstance(body.get("signups_chart"), list), (
        f"Expected signups_chart to be a list, got: {type(body.get('signups_chart'))}"
    )

    # workflow_chart must be a list
    assert isinstance(body.get("workflow_chart"), list), (
        f"Expected workflow_chart to be a list, got: {type(body.get('workflow_chart'))}"
    )


@given(time_range=_valid_time_range_st)
@hyp_settings(max_examples=20)
def test_p18_time_range_echoed_matches_request(time_range: str):
    """
    **Validates: Requirements 7.4**

    Property 18 (echo correctness): The time_range field in the response
    must exactly match the requested time_range parameter.
    """
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get(
            f"/api/admin/dashboard/charts?time_range={time_range}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    echoed = body.get("time_range")
    assert echoed == time_range, (
        f"time_range mismatch: requested {time_range!r}, response echoed {echoed!r}"
    )


# ---------------------------------------------------------------------------
# Invalid time_range values return 422
# ---------------------------------------------------------------------------

_invalid_time_range_st = st.text(
    alphabet=st.characters(min_codepoint=32, max_codepoint=126),
    min_size=1,
    max_size=20,
).filter(lambda s: s not in VALID_TIME_RANGES)


@given(invalid_range=_invalid_time_range_st)
@hyp_settings(max_examples=20)
def test_p18_invalid_time_range_returns_422(invalid_range: str):
    """
    **Validates: Requirements 7.4**

    Property 18 (invalid input): Any time_range value not in {"7d","30d","90d"}
    should return 422 (Unprocessable Entity).
    """
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=False)
        response = client.get(
            f"/api/admin/dashboard/charts?time_range={invalid_range}",
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 422, (
        f"Expected 422 for invalid time_range={invalid_range!r}, "
        f"got {response.status_code}: {response.text}"
    )


# ---------------------------------------------------------------------------
# Baseline unit tests (non-property)
# ---------------------------------------------------------------------------

def test_charts_default_time_range_is_7d():
    """GET /api/admin/dashboard/charts without time_range defaults to 7d."""
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/charts")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["time_range"] == "7d"
    assert isinstance(body["signups_chart"], list)
    assert isinstance(body["workflow_chart"], list)


def test_charts_returns_empty_lists_when_no_data():
    """Charts endpoint returns empty lists when DB has no data."""
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/charts?time_range=30d")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["signups_chart"] == []
    assert body["workflow_chart"] == []


def test_overview_returns_200_with_zero_counts():
    """GET /api/admin/dashboard/overview returns 200 with zero counts when DB is empty."""
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["total_users"] == 0
    assert body["total_workflow_runs"] == 0
    assert body["active_subscriptions"] == 0
    assert isinstance(body["tier_distribution"], dict)


def test_charts_without_token_returns_401():
    """GET /api/admin/dashboard/charts without admin_token returns 401."""
    mock_db = _make_dashboard_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/dashboard/charts?time_range=7d")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_overview_without_token_returns_401():
    """GET /api/admin/dashboard/overview without admin_token returns 401."""
    mock_db = _make_dashboard_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/dashboard/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401
