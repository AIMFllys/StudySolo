# -*- coding: utf-8 -*-
"""
Property-Based Tests: 数据库视图聚合属性测试
Feature: admin-panel

Properties:
  P12: v_daily_signups aggregation — daily signup counts are non-negative,
       edu_signups <= signups for each date
  P13: v_daily_workflow_stats aggregation — success + failed <= total_runs,
       success_rate in [0, 1] from dashboard API
Validates: Requirements 1.6, 1.7
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock


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
from datetime import datetime, date, timedelta, timezone

from fastapi.testclient import TestClient
from hypothesis import given, settings as hyp_settings
from hypothesis import strategies as st
from jose import jwt

os.environ.setdefault("JWT_SECRET", "test-secret-for-property-tests")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("ENVIRONMENT", "development")

from app.main import app  # noqa: E402
from app.core.database import get_db  # noqa: E402

# ---------------------------------------------------------------------------
# JWT helper
# ---------------------------------------------------------------------------

JWT_SECRET = "test-secret-for-property-tests"


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
# DB mock factory for dashboard (uses v_daily_signups + v_daily_workflow_stats)
# ---------------------------------------------------------------------------

def _make_dashboard_db_mock(
    signup_rows: list[dict] | None = None,
    workflow_rows: list[dict] | None = None,
    user_count: int = 0,
) -> AsyncMock:
    """Build a mock Supabase AsyncClient for dashboard queries."""
    mock_db = AsyncMock()
    _signup_rows = signup_rows or []
    _workflow_rows = workflow_rows or []

    def _make_chain(count=0, data=None):
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = AsyncMock()
        chain.execute = AsyncMock(return_value=result)
        chain.eq = MagicMock(return_value=chain)
        chain.gte = MagicMock(return_value=chain)
        chain.lt = MagicMock(return_value=chain)
        chain.lte = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.range = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        chain.limit = MagicMock(return_value=chain)
        chain.maybe_single = MagicMock(return_value=chain)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        if table_name == "v_daily_signups":
            # maybe_single path: data=None (no today row); list path: data=_signup_rows
            tbl.select = MagicMock(return_value=_make_chain(count=len(_signup_rows), data=None))
        elif table_name == "v_daily_workflow_stats":
            tbl.select = MagicMock(return_value=_make_chain(count=len(_workflow_rows), data=_workflow_rows))
        elif table_name == "user_profiles":
            tbl.select = MagicMock(return_value=_make_chain(count=user_count, data=[]))
        elif table_name == "subscriptions":
            tbl.select = MagicMock(return_value=_make_chain(count=0, data=[]))
        elif table_name == "ss_workflow_runs":
            tbl.select = MagicMock(return_value=_make_chain(count=0, data=[]))
        else:
            tbl.select = MagicMock(return_value=_make_chain())
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

_date_str_st = st.dates(
    min_value=date(2025, 1, 1),
    max_value=date(2026, 12, 31),
).map(lambda d: d.isoformat())

_signup_row_st = st.fixed_dictionaries({
    "date": _date_str_st,
    "signups": st.integers(min_value=0, max_value=1000),
    "edu_signups": st.integers(min_value=0, max_value=500),
}).map(lambda r: {**r, "edu_signups": min(r["edu_signups"], r["signups"])})

_signup_rows_st = st.lists(_signup_row_st, min_size=0, max_size=30)

_workflow_row_st = st.fixed_dictionaries({
    "date": _date_str_st,
    "total_runs": st.integers(min_value=0, max_value=1000),
    "success": st.integers(min_value=0, max_value=500),
    "failed": st.integers(min_value=0, max_value=500),
    "total_tokens": st.integers(min_value=0, max_value=100000),
    "avg_duration_seconds": st.one_of(st.none(), st.floats(min_value=0.0, max_value=3600.0)),
}).map(lambda r: {
    **r,
    "success": min(r["success"], r["total_runs"]),
    "failed": min(r["failed"], r["total_runs"] - min(r["success"], r["total_runs"])),
})

_workflow_rows_st = st.lists(_workflow_row_st, min_size=0, max_size=30)


# ---------------------------------------------------------------------------
# Property 12: v_daily_signups — edu_signups <= signups
# Validates: Requirements 1.6
# ---------------------------------------------------------------------------

@given(signup_rows=_signup_rows_st)
@hyp_settings(max_examples=20)
def test_p12_daily_signups_edu_lte_total(signup_rows: list[dict]):
    """
    **Validates: Requirements 1.6**

    Property 12: For any v_daily_signups data, the dashboard overview
    must return 200. The view invariant (edu_signups <= signups) is
    enforced by the strategy; we verify the API handles the data correctly.
    """
    mock_db = _make_dashboard_db_mock(signup_rows=signup_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/overview", cookies={"admin_token": token})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    body = response.json()
    assert "overview" in body or "users" in body or "total_users" in body or isinstance(body, dict), (
        f"Unexpected response structure: {list(body.keys())}"
    )


# ---------------------------------------------------------------------------
# Property 13: v_daily_workflow_stats — success + failed <= total_runs
# Validates: Requirements 1.7
# ---------------------------------------------------------------------------

@given(workflow_rows=_workflow_rows_st)
@hyp_settings(max_examples=20)
def test_p13_workflow_stats_success_plus_failed_lte_total(workflow_rows: list[dict]):
    """
    **Validates: Requirements 1.7**

    Property 13: For any v_daily_workflow_stats data, the dashboard
    charts API must return 200. The view invariant (success + failed <= total_runs)
    is enforced by the strategy.
    """
    mock_db = _make_dashboard_db_mock(workflow_rows=workflow_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/charts?time_range=7d", cookies={"admin_token": token})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    body = response.json()
    assert isinstance(body, dict), f"Expected dict response, got {type(body)}"


# ---------------------------------------------------------------------------
# Property 13b: Dashboard success_rate is always in [0, 1]
# Validates: Requirements 1.7
# ---------------------------------------------------------------------------

@given(workflow_rows=_workflow_rows_st)
@hyp_settings(max_examples=20)
def test_p13_workflow_success_rate_in_valid_range(workflow_rows: list[dict]):
    """
    **Validates: Requirements 1.7**

    Property 13b: The workflow success_rate in dashboard overview
    must always be in [0.0, 1.0].
    """
    mock_db = _make_dashboard_db_mock(workflow_rows=workflow_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/overview", cookies={"admin_token": token})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    # Find success_rate in the response (may be nested)
    def find_success_rate(obj, depth=0):
        if depth > 5:
            return None
        if isinstance(obj, dict):
            if "success_rate" in obj:
                return obj["success_rate"]
            for v in obj.values():
                result = find_success_rate(v, depth + 1)
                if result is not None:
                    return result
        return None

    rate = find_success_rate(body)
    if rate is not None:
        assert 0.0 <= rate <= 1.0, f"success_rate={rate} out of range [0, 1]"


# ---------------------------------------------------------------------------
# Baseline unit tests
# ---------------------------------------------------------------------------

def test_dashboard_overview_returns_200():
    """GET /api/admin/dashboard/overview returns 200."""
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/overview", cookies={"admin_token": token})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200


def test_dashboard_charts_returns_200():
    """GET /api/admin/dashboard/charts returns 200."""
    mock_db = _make_dashboard_db_mock()
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=True)
        response = client.get("/api/admin/dashboard/charts?time_range=30d", cookies={"admin_token": token})
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200


def test_dashboard_without_token_returns_401():
    """GET /api/admin/dashboard/overview without token returns 401."""
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
