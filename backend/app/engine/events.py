"""Standard SSE helpers for workflow execution."""

import json
from typing import Any


def _compact_meta(meta: dict[str, Any] | None) -> dict[str, Any]:
    if not meta:
        return {}
    return {
        key: value
        for key, value in meta.items()
        if value is not None
    }


def sse_event(event_type: str, data: dict, meta: dict[str, Any] | None = None) -> str:
    """Format a single Server-Sent Event string."""
    payload = {**data, **_compact_meta(meta)}
    return f"event: {event_type}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def event_message(event_type: str, data: dict, meta: dict[str, Any] | None = None) -> dict[str, str]:
    """Build an EventSourceResponse-compatible event payload."""
    payload = {**data, **_compact_meta(meta)}
    return {
        "event": event_type,
        "data": json.dumps(payload, ensure_ascii=False),
    }


def parse_sse_frame(event: str) -> tuple[str | None, dict[str, Any] | None]:
    """Parse a raw SSE frame into (event_type, payload)."""
    event_type: str | None = None
    payload_line: str | None = None

    for line in event.strip().split("\n"):
        if line.startswith("event: "):
            event_type = line[7:]
        elif line.startswith("data: "):
            payload_line = line[6:]

    if payload_line is None:
        return event_type, None

    return event_type, json.loads(payload_line)
