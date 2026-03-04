"""SSE event formatting utilities."""

import json


def sse_event(event_type: str, data: dict) -> str:
    """Format a single Server-Sent Event string.

    Returns:
        A properly formatted SSE string: "event: ...\ndata: ...\n\n"
    """
    return f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
