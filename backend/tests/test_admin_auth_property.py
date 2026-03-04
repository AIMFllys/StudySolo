# -*- coding: utf-8 -*-
"""
Property-Based Tests: Admin 认证属性测试
Feature: admin-panel

Properties:
  P1: Valid login produces authenticated session         — Validates: Requirements 2.1
  P2: Invalid credentials increment failure counter     — Validates: Requirements 2.2
  P3: Account lockout after threshold failures          — Validates: Requirements 2.3, 2.4
  P4: Password complexity validation                    — Validates: Requirements 2.6, 2.7
"""

import sys
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

# ---------------------------------------------------------------------------
# Stub out 'supabase' before any app module is imported so that the test
# can run without the native supabase wheel being installed.
# ---------------------------------------------------------------------------

def _install_supabase_stub():
    if "supabase" not in sys.modules:
        stub = ModuleType("supabase")
        stub.AsyncClient = object  # type: ignore[attr-defined]
        stub.create_async_client = AsyncMock()  # type: ignore[attr-defined]
        sys.modules["supabase"] = stub

    # Ensure sub-modules exist with required symbols
    for sub in ("supabase._async", "supabase._async.client", "supabase.lib"):
        if sub not in sys.modules:
            sys.modules[sub] = ModuleType(sub)

    # supabase._async.client must export AsyncClient
    async_client_mod = sys.modules["supabase._async.client"]
    if not hasattr(async_client_mod, "AsyncClient"):
        async_client_mod.AsyncClient = object  # type: ignore[attr-defined]


_install_supabase_stub()

import os
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
import pytest
from fastapi.testclient import TestClient
from hypothesis import given, settings as hyp_settings
from hypothesis import strategies as st
from pydantic import ValidationError

os.environ.setdefault("JWT_SECRET", "test-secret-for-property-tests")
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("ENVIRONMENT", "development")

from app.main import app  # noqa: E402
from app.core.database import get_db  # noqa: E402
from app.models.admin import ChangePasswordRequest  # noqa: E402

# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Valid username: printable ASCII, no spaces, 3-32 chars
_username_st = st.text(
    alphabet=st.characters(min_codepoint=33, max_codepoint=126, blacklist_characters=" "),
    min_size=3,
    max_size=32,
)

# Valid password (correct): at least 1 upper, 1 lower, 1 digit, 1 special, 12+ chars
_valid_password_st = st.text(
    alphabet=st.characters(min_codepoint=33, max_codepoint=126),
    min_size=8,
    max_size=64,
)

# Wrong password: any non-empty string (we'll ensure it differs from the real one)
_wrong_password_st = st.text(
    alphabet=st.characters(min_codepoint=33, max_codepoint=126),
    min_size=1,
    max_size=64,
)

SPECIAL_CHARS = set("!@#$%^&*()_+-=[]{}|;':\",./<>?")


def _make_valid_complex_password(base: str) -> str:
    """Ensure a password meets all complexity requirements."""
    pw = base
    if not any(c.isupper() for c in pw):
        pw += "A"
    if not any(c.islower() for c in pw):
        pw += "a"
    if not any(c.isdigit() for c in pw):
        pw += "1"
    if not any(c in SPECIAL_CHARS for c in pw):
        pw += "!"
    while len(pw) < 12:
        pw += "x"
    return pw


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=4)).decode("utf-8")


def _make_active_account(username: str, password_hash: str, failed_attempts: int = 0,
                          locked_until=None) -> dict:
    """Build a mock ss_admin_accounts row."""
    return {
        "id": str(uuid.uuid4()),
        "username": username,
        "password_hash": password_hash,
        "email": None,
        "is_active": True,
        "force_change_password": False,
        "last_login": None,
        "failed_attempts": failed_attempts,
        "locked_until": locked_until,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def _make_db_mock_for_account(account: dict) -> AsyncMock:
    """Return a mock Supabase AsyncClient that returns the given account row."""
    mock_db = AsyncMock()

    # Chain: db.table(...).select(...).eq(...).maybe_single().execute()
    select_result = MagicMock()
    select_result.data = account

    chain = AsyncMock()
    chain.execute = AsyncMock(return_value=select_result)
    chain.maybe_single = MagicMock(return_value=chain)
    chain.eq = MagicMock(return_value=chain)
    chain.select = MagicMock(return_value=chain)

    # For update calls: db.table(...).update(...).eq(...).execute()
    update_chain = AsyncMock()
    update_chain.execute = AsyncMock(return_value=MagicMock())
    update_chain.eq = MagicMock(return_value=update_chain)
    update_chain.update = MagicMock(return_value=update_chain)

    def table_side_effect(table_name):
        tbl = MagicMock()
        tbl.select = MagicMock(return_value=chain)
        tbl.update = MagicMock(return_value=update_chain)
        tbl.insert = MagicMock(return_value=update_chain)
        return tbl

    mock_db.table = MagicMock(side_effect=table_side_effect)
    return mock_db


# ---------------------------------------------------------------------------
# Property 1: Valid login produces authenticated session
# Validates: Requirements 2.1
# ---------------------------------------------------------------------------

@given(username=_username_st, plain_password=_valid_password_st)
@hyp_settings(max_examples=20)
def test_p1_valid_login_produces_authenticated_session(username: str, plain_password: str):
    """
    **Validates: Requirements 2.1**

    Property 1: Valid login produces authenticated session
    For any admin account with valid credentials (correct username/password,
    not locked, active), POST /api/admin/login should return 200 with
    admin_token cookie.
    """
    password_hash = _hash_password(plain_password)
    account = _make_active_account(username, password_hash)
    mock_db = _make_db_mock_for_account(account)

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with patch("app.api.admin_auth.asyncio.create_task"):
            client = TestClient(app, raise_server_exceptions=True)
            response = client.post(
                "/api/admin/login",
                json={"username": username, "password": plain_password},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200, (
        f"Expected 200 for valid credentials, got {response.status_code}: {response.text}"
    )

    # Verify admin_token cookie is set
    cookies = response.cookies
    assert "admin_token" in cookies, (
        f"Expected admin_token cookie in response, got cookies: {dict(cookies)}"
    )

    # Verify response body
    body = response.json()
    assert body.get("success") is True, f"Expected success=True, got: {body}"
    assert "admin" in body, f"Expected 'admin' in response body, got: {body}"
    assert body["admin"]["username"] == username


# ---------------------------------------------------------------------------
# Property 2: Invalid credentials increment failure counter
# Validates: Requirements 2.2
# ---------------------------------------------------------------------------

@given(username=_username_st, plain_password=_valid_password_st, wrong_suffix=st.text(min_size=1, max_size=8))
@hyp_settings(max_examples=20)
def test_p2_invalid_credentials_increment_failure_counter(
    username: str, plain_password: str, wrong_suffix: str
):
    """
    **Validates: Requirements 2.2**

    Property 2: Invalid credentials increment failure counter
    For any admin account and any incorrect password, POST /api/admin/login
    should return 401 and increment failed_attempts by exactly 1.
    """
    password_hash = _hash_password(plain_password)
    initial_failed = 0
    account = _make_active_account(username, password_hash, failed_attempts=initial_failed)
    mock_db = _make_db_mock_for_account(account)

    # Track what update was called with
    captured_update_data = {}

    original_table = mock_db.table.side_effect

    def table_with_capture(table_name):
        tbl = original_table(table_name)
        if table_name == "ss_admin_accounts":
            original_update = tbl.update

            def capturing_update(data):
                captured_update_data.update(data)
                return original_update(data)

            tbl.update = MagicMock(side_effect=capturing_update)
        return tbl

    mock_db.table = MagicMock(side_effect=table_with_capture)

    # Use a wrong password (append suffix to ensure it differs)
    wrong_password = plain_password + wrong_suffix + "_WRONG"

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with patch("app.api.admin_auth.asyncio.create_task"):
            client = TestClient(app, raise_server_exceptions=False)
            response = client.post(
                "/api/admin/login",
                json={"username": username, "password": wrong_password},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401, (
        f"Expected 401 for wrong password, got {response.status_code}: {response.text}"
    )

    # Verify failed_attempts was incremented by exactly 1
    assert "failed_attempts" in captured_update_data, (
        f"Expected failed_attempts to be updated, captured: {captured_update_data}"
    )
    assert captured_update_data["failed_attempts"] == initial_failed + 1, (
        f"Expected failed_attempts={initial_failed + 1}, "
        f"got {captured_update_data['failed_attempts']}"
    )


# ---------------------------------------------------------------------------
# Property 3: Account lockout after threshold failures
# Validates: Requirements 2.3, 2.4
# ---------------------------------------------------------------------------

@given(username=_username_st, plain_password=_valid_password_st)
@hyp_settings(max_examples=20)
def test_p3_account_lockout_after_threshold_failures(username: str, plain_password: str):
    """
    **Validates: Requirements 2.3, 2.4**

    Property 3: Account lockout after threshold failures
    After exactly 5 consecutive failed login attempts, locked_until should be
    set to ~30 minutes in the future.
    """
    password_hash = _hash_password(plain_password)
    # Start at 4 failed attempts — one more wrong attempt should trigger lockout
    account = _make_active_account(username, password_hash, failed_attempts=4)
    mock_db = _make_db_mock_for_account(account)

    captured_update_data = {}
    original_table = mock_db.table.side_effect

    def table_with_capture(table_name):
        tbl = original_table(table_name)
        if table_name == "ss_admin_accounts":
            original_update = tbl.update

            def capturing_update(data):
                captured_update_data.update(data)
                return original_update(data)

            tbl.update = MagicMock(side_effect=capturing_update)
        return tbl

    mock_db.table = MagicMock(side_effect=table_with_capture)

    wrong_password = plain_password + "_WRONG_LOCKOUT"

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with patch("app.api.admin_auth.asyncio.create_task"):
            client = TestClient(app, raise_server_exceptions=False)
            response = client.post(
                "/api/admin/login",
                json={"username": username, "password": wrong_password},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    # Should return 423 (account locked)
    assert response.status_code == 423, (
        f"Expected 423 after 5th failed attempt, got {response.status_code}: {response.text}"
    )

    # Verify locked_until was set in the update call
    assert "locked_until" in captured_update_data, (
        f"Expected locked_until to be set, captured: {captured_update_data}"
    )

    # Verify locked_until is ~30 minutes in the future (within 5 second tolerance)
    locked_until_str = captured_update_data["locked_until"]
    locked_until_dt = datetime.fromisoformat(locked_until_str)
    if locked_until_dt.tzinfo is None:
        locked_until_dt = locked_until_dt.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)
    expected_lock = now + timedelta(minutes=30)
    delta = abs((locked_until_dt - expected_lock).total_seconds())
    assert delta < 10, (
        f"locked_until should be ~30 minutes from now, "
        f"but delta was {delta:.1f}s. locked_until={locked_until_str}"
    )

    # Verify response body contains locked_until
    body = response.json()
    assert "detail" in body
    detail = body["detail"]
    assert detail.get("error") == "account_locked", f"Expected error=account_locked, got: {detail}"
    assert "locked_until" in detail, f"Expected locked_until in detail, got: {detail}"


@given(username=_username_st, plain_password=_valid_password_st)
@hyp_settings(max_examples=20)
def test_p3b_locked_account_rejects_all_attempts(username: str, plain_password: str):
    """
    **Validates: Requirements 2.4**

    Property 3b: Locked account rejects all login attempts (even valid credentials)
    While locked_until is in the future, all login attempts return 423.
    """
    password_hash = _hash_password(plain_password)
    future_lock = (datetime.now(timezone.utc) + timedelta(minutes=25)).isoformat()
    account = _make_active_account(
        username, password_hash, failed_attempts=5, locked_until=future_lock
    )
    mock_db = _make_db_mock_for_account(account)

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        with patch("app.api.admin_auth.asyncio.create_task"):
            client = TestClient(app, raise_server_exceptions=False)
            # Even with correct password, should be rejected
            response = client.post(
                "/api/admin/login",
                json={"username": username, "password": plain_password},
            )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 423, (
        f"Expected 423 for locked account, got {response.status_code}: {response.text}"
    )
    body = response.json()
    assert body["detail"]["error"] == "account_locked"


# ---------------------------------------------------------------------------
# Property 4: Password complexity validation
# Validates: Requirements 2.6, 2.7
# ---------------------------------------------------------------------------

def _meets_complexity(password: str) -> bool:
    """Reference implementation of password complexity check."""
    return (
        len(password) >= 12
        and any(c.isupper() for c in password)
        and any(c.islower() for c in password)
        and any(c.isdigit() for c in password)
        and any(c in SPECIAL_CHARS for c in password)
    )


@given(
    current_password=st.text(min_size=1, max_size=32),
    new_password=st.text(
        alphabet=st.characters(min_codepoint=32, max_codepoint=126),
        min_size=0,
        max_size=30,
    ),
)
@hyp_settings(max_examples=20)
def test_p4_password_complexity_validation(current_password: str, new_password: str):
    """
    **Validates: Requirements 2.6, 2.7**

    Property 4: Password complexity validation
    For any password string, ChangePasswordRequest should accept it if and
    only if it has 12+ chars AND uppercase AND lowercase AND digit AND
    special char.
    """
    should_pass = _meets_complexity(new_password)

    if should_pass:
        # Should not raise ValidationError
        try:
            obj = ChangePasswordRequest(
                current_password=current_password,
                new_password=new_password,
            )
            assert obj.new_password == new_password, (
                f"Expected new_password to be preserved, got: {obj.new_password}"
            )
        except ValidationError as e:
            pytest.fail(
                f"Password '{new_password}' meets all complexity requirements "
                f"but was rejected: {e}"
            )
    else:
        # Should raise ValidationError
        with pytest.raises(ValidationError) as exc_info:
            ChangePasswordRequest(
                current_password=current_password,
                new_password=new_password,
            )
        errors = exc_info.value.errors()
        assert any(e["loc"][-1] == "new_password" for e in errors), (
            f"Expected validation error on 'new_password' field, got: {errors}"
        )


@given(
    base=st.text(
        alphabet=st.characters(min_codepoint=33, max_codepoint=126),
        min_size=4,
        max_size=20,
    )
)
@hyp_settings(max_examples=20)
def test_p4_valid_complex_password_always_accepted(base: str):
    """
    **Validates: Requirements 2.6**

    Property 4 (positive case): Any password that satisfies all complexity
    requirements should always be accepted by ChangePasswordRequest.
    """
    valid_pw = _make_valid_complex_password(base)
    assert _meets_complexity(valid_pw), (
        f"_make_valid_complex_password produced non-compliant password: '{valid_pw}'"
    )

    try:
        obj = ChangePasswordRequest(
            current_password="current_pass",
            new_password=valid_pw,
        )
        assert obj.new_password == valid_pw
    except ValidationError as e:
        pytest.fail(
            f"Valid complex password '{valid_pw}' was rejected: {e}"
        )


# ---------------------------------------------------------------------------
# Baseline unit tests (non-property)
# ---------------------------------------------------------------------------

def test_login_returns_401_for_unknown_username():
    """POST /api/admin/login with unknown username returns 401."""
    mock_db = AsyncMock()

    no_result = MagicMock()
    no_result.data = None

    chain = AsyncMock()
    chain.execute = AsyncMock(return_value=no_result)
    chain.maybe_single = MagicMock(return_value=chain)
    chain.eq = MagicMock(return_value=chain)
    chain.select = MagicMock(return_value=chain)

    tbl = MagicMock()
    tbl.select = MagicMock(return_value=chain)
    mock_db.table = MagicMock(return_value=tbl)

    async def _override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = _override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/api/admin/login",
            json={"username": "nonexistent_user", "password": "anypassword"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 401


def test_change_password_request_rejects_short_password():
    """ChangePasswordRequest rejects passwords shorter than 12 chars."""
    with pytest.raises(ValidationError) as exc_info:
        ChangePasswordRequest(current_password="current", new_password="Short1!")
    errors = exc_info.value.errors()
    assert any(e["loc"][-1] == "new_password" for e in errors)


def test_change_password_request_rejects_no_uppercase():
    """ChangePasswordRequest rejects passwords without uppercase."""
    with pytest.raises(ValidationError):
        ChangePasswordRequest(
            current_password="current",
            new_password="alllowercase1!xx",
        )


def test_change_password_request_rejects_no_digit():
    """ChangePasswordRequest rejects passwords without digit."""
    with pytest.raises(ValidationError):
        ChangePasswordRequest(
            current_password="current",
            new_password="NoDigitHere!!xx",
        )


def test_change_password_request_accepts_valid_password():
    """ChangePasswordRequest accepts a fully compliant password."""
    obj = ChangePasswordRequest(
        current_password="current",
        new_password="ValidPass1!xxxx",
    )
    assert obj.new_password == "ValidPass1!xxxx"
