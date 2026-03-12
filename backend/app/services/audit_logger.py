"""Audit Logger Service.

Provides fire-and-forget audit logging for all admin operations.
Records are inserted into ss_admin_audit_logs without blocking the main request path.
"""

import asyncio
import logging
from typing import Any

from fastapi import Request
from supabase._async.client import AsyncClient

logger = logging.getLogger(__name__)


def get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP address and user-agent from a FastAPI Request.

    Returns:
        (ip_address, user_agent) tuple — either value may be None.
    """
    # Respect X-Forwarded-For when behind a proxy/load balancer
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None

    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


async def log_action(
    db: AsyncClient,
    admin_id: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Insert an audit log record into ss_admin_audit_logs.

    This function is designed for fire-and-forget usage via asyncio.create_task().
    All exceptions are caught and logged to the Python logger — audit logging
    never raises and never blocks the main request path.

    Args:
        db:          Supabase AsyncClient (service_role, bypasses RLS).
        admin_id:    UUID of the acting admin (may be None for pre-auth events).
        action:      Action name, e.g. "login_success", "user_status_toggle".
        target_type: Resource type, e.g. "user", "notice", "config".
        target_id:   Target resource ID (string form of UUID or key).
        details:     JSONB payload with before/after values or extra context.
        ip_address:  Client IP address.
        user_agent:  Client user-agent string.
    """
    try:
        record: dict[str, Any] = {"action": action}
        if admin_id is not None:
            record["admin_id"] = admin_id
        if target_type is not None:
            record["target_type"] = target_type
        if target_id is not None:
            record["target_id"] = target_id
        if details is not None:
            record["details"] = details
        if ip_address is not None:
            record["ip_address"] = ip_address
        if user_agent is not None:
            record["user_agent"] = user_agent

        await db.table("ss_admin_audit_logs").insert(record).execute()
    except Exception as exc:  # noqa: BLE001
        logger.error("Audit log insertion failed (action=%s): %s", action, exc)


def _consume_task_result(task: asyncio.Task[None]) -> None:
    """Drain task exceptions so background audit logging stays quiet in tests and prod."""
    try:
        task.result()
    except Exception as exc:  # noqa: BLE001
        logger.error("Queued audit log task failed: %s", exc)


def queue_audit_log(
    db: AsyncClient,
    admin_id: str | None,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> asyncio.Task[None] | None:
    """Schedule audit logging on the running loop, or skip cleanly when no loop is active."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        logger.debug("Skipping audit log queue because no running event loop is available")
        return None

    task = loop.create_task(
        log_action(
            db,
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
    )
    task.add_done_callback(_consume_task_result)
    return task
