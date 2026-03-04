"""Admin JWT middleware — protects /api/admin/* routes (except /login and OPTIONS)."""

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.database import get_db

# Paths under /api/admin/ that are publicly accessible (no token required)
_PUBLIC_ADMIN_PATHS = {"/api/admin/login"}


class AdminJWTMiddleware(BaseHTTPMiddleware):
    """Validate admin_token cookie for all /api/admin/* routes.

    - Skips /api/admin/login and OPTIONS requests.
    - On valid token: attaches admin_id to request.state.admin_id.
    - On invalid/expired token: returns 401.
    - On inactive account: returns 403.
    """

    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Only handle /api/admin/* paths
        if not path.startswith("/api/admin/"):
            return await call_next(request)

        # Always allow CORS preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        # Allow public admin paths (login)
        if path in _PUBLIC_ADMIN_PATHS:
            return await call_next(request)

        # Extract admin_token cookie
        token = request.cookies.get("admin_token")
        if not token:
            return JSONResponse(
                status_code=401,
                content={"detail": "管理员未认证"},
            )

        # Validate JWT
        try:
            settings = get_settings()
            payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])

            # Verify token type claim
            if payload.get("type") != "admin":
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token 类型无效"},
                )

            admin_id: str | None = payload.get("sub")
            if not admin_id:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Token 缺少 sub 字段"},
                )

        except JWTError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Token 无效或已过期"},
            )

        # Optional: verify account is still active in DB
        try:
            db = await get_db()
            result = (
                await db.table("ss_admin_accounts")
                .select("id, is_active")
                .eq("id", admin_id)
                .maybe_single()
                .execute()
            )
            account = result.data if result else None
            if not account:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "管理员账号不存在"},
                )
            if not account.get("is_active", True):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "管理员账号已被禁用"},
                )
        except Exception as e:
            # Log but don't block — JWT is already validated
            import logging
            logging.getLogger(__name__).warning(
                "AdminJWTMiddleware: DB check failed for admin_id=%s: %s", admin_id, e
            )

        # Attach admin_id to request state for downstream handlers
        request.state.admin_id = admin_id

        return await call_next(request)
