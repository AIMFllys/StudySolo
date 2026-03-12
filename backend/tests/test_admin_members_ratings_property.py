# -*- coding: utf-8 -*-
"""
Property-Based Tests: 会员分布和评分属性测试
Feature: admin-panel

Properties:
  P16: Member tier distribution — free/pro/pro_plus/ultra counts are non-negative,
       paid_total = pro + pro_plus + ultra, total = free + paid_total
  P17: Ratings NPS/CSAT aggregation — NPS score in [-100, 100],
       CSAT avg in [1, 5] when data exists, counts are non-negative
Validates: Requirements 12.1, 13.1
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
# JWT helper
# ---------------------------------------------------------------------------

JWT_SECRET = TEST_JWT_SECRET
VALID_TIERS = ["free", "pro", "pro_plus", "ultra"]


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
# DB mock factories
# ---------------------------------------------------------------------------

def _make_members_db_mock(tier_rows: list[dict] | None = None) -> AsyncMock:
    """Build a mock Supabase AsyncClient for member queries."""
    mock_db = MagicMock()
    _rows = tier_rows or []

    def _make_chain(count=0, data=None):
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        chain.eq = MagicMock(return_value=chain)
        chain.neq = MagicMock(return_value=chain)
        chain.gte = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.range = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        chain.limit = MagicMock(return_value=chain)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        if table_name == "user_profiles":
            tbl.select = MagicMock(return_value=_make_chain(count=len(_rows), data=_rows))
        elif table_name == "subscriptions":
            tbl.select = MagicMock(return_value=_make_chain(count=0, data=[]))
        else:
            tbl.select = MagicMock(return_value=_make_chain())
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


def _make_ratings_db_mock(rating_rows: list[dict] | None = None) -> AsyncMock:
    """Build a mock Supabase AsyncClient for ratings queries."""
    mock_db = MagicMock()
    _rows = rating_rows or []

    def _make_chain(count=0, data=None):
        result = MagicMock()
        result.count = count
        result.data = data if data is not None else []

        chain = MagicMock()
        chain.execute = AsyncMock(return_value=result)
        chain.eq = MagicMock(return_value=chain)
        chain.order = MagicMock(return_value=chain)
        chain.range = MagicMock(return_value=chain)
        chain.select = MagicMock(return_value=chain)
        chain.limit = MagicMock(return_value=chain)
        return chain

    def table_side_effect(table_name: str):
        tbl = MagicMock()
        if table_name == "ss_ratings":
            tbl.select = MagicMock(return_value=_make_chain(count=len(_rows), data=_rows))
        else:
            tbl.select = MagicMock(return_value=_make_chain())
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

_tier_st = st.sampled_from(VALID_TIERS)

_tier_rows_st = st.lists(
    st.fixed_dictionaries({"tier": _tier_st}),
    min_size=0,
    max_size=50,
)

_nps_score_st = st.integers(min_value=0, max_value=10)
_csat_score_st = st.integers(min_value=1, max_value=5)

_nps_rows_st = st.lists(
    st.fixed_dictionaries({"rating_type": st.just("nps"), "score": _nps_score_st}),
    min_size=0,
    max_size=30,
)

_csat_rows_st = st.lists(
    st.fixed_dictionaries({"rating_type": st.just("csat"), "score": _csat_score_st}),
    min_size=0,
    max_size=30,
)


# ---------------------------------------------------------------------------
# Property 16a: Tier counts are non-negative and sum correctly
# Validates: Requirements 12.1
# ---------------------------------------------------------------------------

@given(tier_rows=_tier_rows_st)
@hyp_settings(max_examples=20)
def test_p16_tier_counts_sum_correctly(tier_rows: list[dict]):
    """
    **Validates: Requirements 12.1**

    Property 16a: For any set of user_profiles rows with valid tiers,
    the stats response must satisfy:
      - All counts >= 0
      - paid_total = pro + pro_plus + ultra
      - total = free + pro + pro_plus + ultra
    """
    mock_db = _make_members_db_mock(tier_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/members/stats")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    body = response.json()

    free = body["free"]
    pro = body["pro"]
    pro_plus = body["pro_plus"]
    ultra = body["ultra"]
    total = body["total"]
    paid_total = body["paid_total"]

    assert free >= 0
    assert pro >= 0
    assert pro_plus >= 0
    assert ultra >= 0
    assert paid_total == pro + pro_plus + ultra, (
        f"paid_total={paid_total} != pro({pro}) + pro_plus({pro_plus}) + ultra({ultra})"
    )
    assert total == free + pro + pro_plus + ultra, (
        f"total={total} != free({free}) + pro({pro}) + pro_plus({pro_plus}) + ultra({ultra})"
    )


# ---------------------------------------------------------------------------
# Property 16b: Tier counts match input data
# Validates: Requirements 12.1
# ---------------------------------------------------------------------------

@given(tier_rows=_tier_rows_st)
@hyp_settings(max_examples=20)
def test_p16_tier_counts_match_input(tier_rows: list[dict]):
    """
    **Validates: Requirements 12.1**

    Property 16b: The tier counts in the response must exactly match
    the counts in the input data.
    """
    mock_db = _make_members_db_mock(tier_rows)
    token = _make_admin_token()

    # Compute expected counts from input
    expected: dict[str, int] = {"free": 0, "pro": 0, "pro_plus": 0, "ultra": 0}
    for row in tier_rows:
        t = row.get("tier", "free") or "free"
        if t in expected:
            expected[t] += 1
        else:
            expected["free"] += 1

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/members/stats")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    for tier_key in ["free", "pro", "pro_plus", "ultra"]:
        assert body[tier_key] == expected[tier_key], (
            f"Tier {tier_key}: expected {expected[tier_key]}, got {body[tier_key]}"
        )


# ---------------------------------------------------------------------------
# Property 17a: NPS score is in [-100, 100] when data exists
# Validates: Requirements 13.1
# ---------------------------------------------------------------------------

@given(nps_rows=_nps_rows_st)
@hyp_settings(max_examples=20)
def test_p17_nps_score_in_valid_range(nps_rows: list[dict]):
    """
    **Validates: Requirements 13.1**

    Property 17a: For any set of NPS ratings (scores 0-10),
    the computed NPS score must be in [-100, 100].
    When no data, nps_score must be None.
    """
    mock_db = _make_ratings_db_mock(nps_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    nps_count = body["nps_count"]
    nps_score = body["nps_score"]

    assert nps_count == len(nps_rows), f"nps_count={nps_count} != {len(nps_rows)}"

    if nps_count == 0:
        assert nps_score is None, f"nps_score should be None when no data, got {nps_score}"
    else:
        assert nps_score is not None
        assert -100 <= nps_score <= 100, f"NPS score {nps_score} out of range [-100, 100]"


# ---------------------------------------------------------------------------
# Property 17b: CSAT avg is in [1, 5] when data exists
# Validates: Requirements 13.1
# ---------------------------------------------------------------------------

@given(csat_rows=_csat_rows_st)
@hyp_settings(max_examples=20)
def test_p17_csat_avg_in_valid_range(csat_rows: list[dict]):
    """
    **Validates: Requirements 13.1**

    Property 17b: For any set of CSAT ratings (scores 1-5),
    the computed CSAT average must be in [1.0, 5.0].
    When no data, csat_avg must be None.
    """
    mock_db = _make_ratings_db_mock(csat_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    csat_count = body["csat_count"]
    csat_avg = body["csat_avg"]

    assert csat_count == len(csat_rows), f"csat_count={csat_count} != {len(csat_rows)}"

    if csat_count == 0:
        assert csat_avg is None, f"csat_avg should be None when no data, got {csat_avg}"
    else:
        assert csat_avg is not None
        assert 1.0 <= csat_avg <= 5.0, f"CSAT avg {csat_avg} out of range [1, 5]"


# ---------------------------------------------------------------------------
# Property 17c: Mixed NPS + CSAT data — counts are independent
# Validates: Requirements 13.1
# ---------------------------------------------------------------------------

@given(
    nps_rows=_nps_rows_st,
    csat_rows=_csat_rows_st,
)
@hyp_settings(max_examples=20)
def test_p17_nps_and_csat_counts_are_independent(
    nps_rows: list[dict], csat_rows: list[dict]
):
    """
    **Validates: Requirements 13.1**

    Property 17c: When both NPS and CSAT ratings exist,
    nps_count and csat_count must independently match their input counts.
    """
    all_rows = nps_rows + csat_rows
    mock_db = _make_ratings_db_mock(all_rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()

    assert body["nps_count"] == len(nps_rows), (
        f"nps_count={body['nps_count']} != {len(nps_rows)}"
    )
    assert body["csat_count"] == len(csat_rows), (
        f"csat_count={body['csat_count']} != {len(csat_rows)}"
    )


# ---------------------------------------------------------------------------
# Baseline unit tests
# ---------------------------------------------------------------------------

def test_member_stats_empty_returns_zeros():
    """GET /api/admin/members/stats with no users returns all zeros."""
    mock_db = _make_members_db_mock([])
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/members/stats")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["free"] == 0
    assert body["pro"] == 0
    assert body["pro_plus"] == 0
    assert body["ultra"] == 0
    assert body["total"] == 0
    assert body["paid_total"] == 0


def test_ratings_overview_empty_returns_nulls():
    """GET /api/admin/ratings/overview with no ratings returns null averages."""
    mock_db = _make_ratings_db_mock([])
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["nps_count"] == 0
    assert body["nps_avg"] is None
    assert body["nps_score"] is None
    assert body["csat_count"] == 0
    assert body["csat_avg"] is None


def test_members_stats_without_token_returns_401():
    """GET /api/admin/members/stats without token returns 401."""
    mock_db = _make_members_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/members/stats")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_ratings_overview_without_token_returns_401():
    """GET /api/admin/ratings/overview without token returns 401."""
    mock_db = _make_ratings_db_mock()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_nps_score_all_promoters():
    """NPS score = 100 when all scores are 9 or 10."""
    rows = [{"rating_type": "nps", "score": 10}] * 5
    mock_db = _make_ratings_db_mock(rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["nps_score"] == 100.0


def test_nps_score_all_detractors():
    """NPS score = -100 when all scores are 6 or below."""
    rows = [{"rating_type": "nps", "score": 3}] * 5
    mock_db = _make_ratings_db_mock(rows)
    token = _make_admin_token()

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = _make_admin_client(token, raise_server_exceptions=True)
        response = client.get("/api/admin/ratings/overview")
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    body = response.json()
    assert body["nps_score"] == -100.0
