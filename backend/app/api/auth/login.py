"""Login, session, password-reset and profile routes."""

import logging
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from supabase import AsyncClient

from app.api.auth._helpers import clear_auth_cookies, set_auth_cookies
from app.core.deps import (
    get_anon_supabase_client,
    get_current_user,
    get_supabase_client,
)
from app.models.user import (
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResetPasswordWithCodeRequest,
    SyncSessionRequest,
    UserInfo,
    UserLogin,
)
from app.services.email_service import send_verification_code_to_email, verify_code

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login")
async def login(
    body: UserLogin,
    response: Response,
    anon_db: AsyncClient = Depends(get_anon_supabase_client),
):
    """Validate credentials via Supabase Auth and set HttpOnly cookies."""
    try:
        result = await anon_db.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as exc:
        detail = str(exc)
        if "email not confirmed" in detail.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="邮箱尚未验证，请查收验证邮件并点击确认链接",
            ) from exc
        if "invalid" in detail.lower() or "credentials" in detail.lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误",
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="登录失败，请重试",
        ) from exc

    if result.session is None or result.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码错误",
        )

    session = result.session
    user = result.user
    set_auth_cookies(
        response,
        session.access_token,
        session.refresh_token,
        body.remember_me,
    )

    user_meta = user.user_metadata or {}
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user": UserInfo(
            id=str(user.id),
            email=user.email or "",
            name=user_meta.get("name") or user_meta.get("full_name"),
            avatar_url=user_meta.get("avatar_url"),
            role=user_meta.get("role", "user"),
        ),
    }


@router.post("/logout")
async def logout(
    response: Response,
    db: AsyncClient = Depends(get_supabase_client),
    access_token: Annotated[str | None, Cookie()] = None,
):
    """Invalidate session and clear cookies."""
    if access_token:
        try:
            await db.auth.sign_out()
        except Exception:
            pass

    clear_auth_cookies(response)
    return {"message": "已退出登录"}


@router.post("/refresh")
async def refresh(
    response: Response,
    anon_db: AsyncClient = Depends(get_anon_supabase_client),
    refresh_token: Annotated[str | None, Cookie()] = None,
    remember_me: Annotated[str | None, Cookie()] = None,
):
    """Refresh access token using refresh_token cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="缺少 refresh_token",
        )

    try:
        result = await anon_db.auth.refresh_session(refresh_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    if result.session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token 刷新失败",
        )

    session = result.session
    keep_signed_in = remember_me != "0"
    set_auth_cookies(
        response,
        session.access_token,
        session.refresh_token,
        keep_signed_in,
    )
    return {
        "message": "Token 已刷新",
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
    }


@router.post("/sync-session")
async def sync_session(
    body: SyncSessionRequest,
    response: Response,
    anon_db: AsyncClient = Depends(get_anon_supabase_client),
):
    """Restore backend cookies from a browser-persisted Supabase session."""
    try:
        result = await anon_db.auth.set_session(body.access_token, body.refresh_token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="本地登录态已失效，请重新登录",
        ) from exc

    if result.session is None or result.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="本地登录态已失效，请重新登录",
        )

    session = result.session
    user = result.user
    set_auth_cookies(
        response,
        session.access_token,
        session.refresh_token,
        body.remember_me,
    )

    user_meta = user.user_metadata or {}
    return {
        "message": "登录状态已恢复",
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "user": UserInfo(
            id=str(user.id),
            email=user.email or "",
            name=user_meta.get("name") or user_meta.get("full_name"),
            avatar_url=user_meta.get("avatar_url"),
            role=user_meta.get("role", "user"),
        ),
    }


@router.post("/forgot-password")
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncClient = Depends(get_supabase_client),
):
    """Send a password reset verification code via DirectMail."""
    try:
        await send_verification_code_to_email(body.email, "reset_password", db)
    except Exception:
        pass
    return {"message": "如果该邮箱已注册，你将收到一封包含验证码的邮件"}


@router.post("/reset-password")
async def reset_password(
    body: ResetPasswordRequest,
    response: Response,
    anon_db: AsyncClient = Depends(get_anon_supabase_client),
):
    """Reset password using the token from reset email link."""
    try:
        session_result = await anon_db.auth.set_session(body.access_token, body.refresh_token)
        if not session_result.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="重置链接无效或已过期",
            )
        update_result = await anon_db.auth.update_user({"password": body.new_password})
        if not update_result.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="密码重置失败",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    clear_auth_cookies(response)
    return {"message": "密码重置成功，请使用新密码登录"}


@router.post("/reset-password-with-code")
async def reset_password_with_code(
    body: ResetPasswordWithCodeRequest,
    db: AsyncClient = Depends(get_supabase_client),
):
    """Reset password using email + verification code."""
    is_valid = await verify_code(body.email, body.code, "reset_password", db)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="验证码无效或已过期，请重新获取",
        )

    try:
        result = await db.from_("user_profiles").select("id").eq("email", body.email).limit(1).execute()
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="该邮箱未注册",
            )

        user_id = result.data[0]["id"]
        await db.auth.admin.update_user_by_id(
            user_id,
            {"password": body.new_password},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to reset password")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="密码重置失败，请重试",
        ) from exc

    return {"message": "密码重置成功，请使用新密码登录"}


@router.get("/me", response_model=UserInfo)
async def me(
    current_user: dict = Depends(get_current_user),
    db: AsyncClient = Depends(get_supabase_client),
):
    """Return the current authenticated user's info."""
    try:
        result = (
            await db.from_("user_profiles")
            .select("*")
            .eq("id", current_user["id"])
            .single()
            .execute()
        )
        row = result.data or {}
    except Exception:
        row = {}

    return UserInfo(
        id=current_user["id"],
        email=current_user.get("email") or row.get("email", ""),
        name=row.get("nickname"),
        avatar_url=row.get("avatar_url"),
        role=row.get("tier", current_user.get("role", "user")),
    )
