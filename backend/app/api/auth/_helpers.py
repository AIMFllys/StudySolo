"""Shared helpers for auth routes."""

import os
from fastapi import Response

_AUTH_COOKIE_MAX_AGE = int(os.getenv("AUTH_COOKIE_MAX_AGE", str(60 * 60 * 24 * 30)))
FRONTEND_URL = os.getenv("CORS_ORIGIN", "http://localhost:2037")


def _is_dev_environment() -> bool:
    """Read the current environment at call time to avoid stale import-time config."""
    return os.getenv("ENVIRONMENT", "development").lower() == "development"


def build_cookie_options(remember_me: bool = True) -> dict:
    """Return cookie options, preserving remember-me semantics."""
    options = {
        "httponly": True,
        "secure": not _is_dev_environment(),
        "samesite": "lax",
        "path": "/",
    }
    if remember_me:
        options["max_age"] = _AUTH_COOKIE_MAX_AGE
    return options


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    remember_me: bool = True,
) -> None:
    """Write access and refresh tokens to HttpOnly cookies."""
    cookie_options = build_cookie_options(remember_me)
    response.set_cookie(key="access_token", value=access_token, **cookie_options)
    response.set_cookie(key="refresh_token", value=refresh_token, **cookie_options)
    response.set_cookie(
        key="remember_me",
        value="1" if remember_me else "0",
        **cookie_options,
    )


def clear_auth_cookies(response: Response) -> None:
    """Clear auth cookies from the response."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    response.delete_cookie(key="remember_me", path="/")
