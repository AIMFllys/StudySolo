"""Streaming XML tag parser for the agent loop protocol.

Reads a stream of LLM tokens (arbitrary chunking) and emits *segment* events
that the API layer can forward to the frontend via SSE. Nested tags are
flattened into dotted paths (e.g. ``tool_use.name``) so the frontend renderer
does not need its own parser.

Event shapes (dict):
    {"type": "segment_start", "tag": "thinking", "attrs": {...}}
    {"type": "segment_delta", "tag": "thinking", "delta": "..."}
    {"type": "segment_end",   "tag": "thinking"}
    {"type": "tool_call_ready", "tool": "rename_workflow", "params": {...}, "call_id": "..."}
    {"type": "text", "delta": "..."}
    {"type": "done"}

Top-level tags recognised as first-class segments: thinking, tool_use, answer,
summary, plan. Anything else outside of a top-level is emitted as plain
``text`` so nothing is silently lost.
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)

TOP_LEVEL_TAGS = {"thinking", "tool_use", "answer", "summary", "plan"}

# Aliases — tags a model may emit that should be treated as a canonical one.
# The most important case is `<think>` used by DeepSeek R1 / OpenAI-style
# `reasoning_content` wrappers, which should render as a `<thinking>` block.
TAG_ALIASES: dict[str, str] = {
    "think": "thinking",
    "reasoning": "thinking",
}

_ATTR_RE = re.compile(r'([a-zA-Z_][\w-]*)\s*=\s*"([^"]*)"')


def _canonical_tag(tag_name: str) -> str:
    return TAG_ALIASES.get(tag_name, tag_name)


@dataclass
class _Segment:
    tag: str
    path: str
    attrs: dict[str, str] = field(default_factory=dict)
    buffer: str = ""


class XmlStreamParser:
    """Incremental XML-ish stream parser. Feed tokens, get back a list of events."""

    def __init__(self) -> None:
        self._buffer: str = ""
        self._stack: list[_Segment] = []
        self._pending_tool_name: str | None = None
        self._pending_tool_params: str | None = None
        self._pending_tool_call_id: str | None = None

    # ──────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────

    def feed(self, token: str) -> list[dict[str, Any]]:
        if not token:
            return []
        self._buffer += token
        events: list[dict[str, Any]] = []
        while True:
            if "<" not in self._buffer:
                if self._buffer:
                    events.extend(self._flush_text(self._buffer))
                    self._buffer = ""
                break
            lt_idx = self._buffer.index("<")
            if lt_idx > 0:
                events.extend(self._flush_text(self._buffer[:lt_idx]))
                self._buffer = self._buffer[lt_idx:]
            if ">" not in self._buffer:
                break  # Incomplete tag; wait for more.
            gt_idx = self._buffer.index(">")
            raw_tag = self._buffer[: gt_idx + 1]
            self._buffer = self._buffer[gt_idx + 1 :]
            events.extend(self._handle_tag(raw_tag))
        return events

    def close(self) -> list[dict[str, Any]]:
        """Flush text + auto-close any still-open tags."""
        events: list[dict[str, Any]] = []
        if self._buffer:
            events.extend(self._flush_text(self._buffer))
            self._buffer = ""
        while self._stack:
            seg = self._stack.pop()
            events.append({"type": "segment_end", "tag": seg.path})
        return events

    # ──────────────────────────────────────────────────────────────
    # Internals
    # ──────────────────────────────────────────────────────────────

    def _flush_text(self, text: str) -> list[dict[str, Any]]:
        if not text:
            return []
        if not self._stack:
            return [{"type": "text", "delta": text}]
        top = self._stack[-1]
        top.buffer += text
        return [{"type": "segment_delta", "tag": top.path, "delta": text}]

    def _compose_path(self, tag: str) -> str:
        # Up to two levels: top-level or top_level.child
        if not self._stack:
            return tag
        root = self._stack[0].tag
        if len(self._stack) == 0:
            return tag
        return f"{root}.{tag}" if root != tag else tag

    def _handle_tag(self, raw: str) -> list[dict[str, Any]]:
        inner = raw[1:-1].strip()
        if not inner:
            return self._flush_text(raw)

        self_closing = inner.endswith("/")
        if self_closing:
            inner = inner[:-1].strip()

        if inner.startswith("/"):
            raw_close = inner[1:].strip().lower()
            return self._close_tag(_canonical_tag(raw_close))

        parts = inner.split(None, 1)
        raw_tag_name = parts[0].lower()
        tag_name = _canonical_tag(raw_tag_name)
        attrs: dict[str, str] = {}
        if len(parts) > 1:
            for m in _ATTR_RE.finditer(parts[1]):
                attrs[m.group(1)] = m.group(2)

        events = self._open_tag(tag_name, attrs)
        if self_closing:
            events.extend(self._close_tag(tag_name))
        return events

    def _open_tag(self, tag_name: str, attrs: dict[str, str]) -> list[dict[str, Any]]:
        if tag_name == "done":
            return [{"type": "done"}]

        if not self._stack and tag_name not in TOP_LEVEL_TAGS:
            # Unknown tag at the root: open an `answer` wrapper so subsequent
            # text still reaches the UI, but DO NOT inject the literal `<tag>`
            # string into the segment (that used to surface as visible XML
            # garbage to the user).
            seg = _Segment(tag="answer", path="answer")
            self._stack.append(seg)
            return [
                {"type": "segment_start", "tag": "answer", "attrs": {}},
            ]

        path = self._compose_path(tag_name)
        seg = _Segment(tag=tag_name, path=path, attrs=attrs)
        self._stack.append(seg)
        events: list[dict[str, Any]] = [
            {"type": "segment_start", "tag": path, "attrs": attrs}
        ]
        if len(self._stack) == 1 and tag_name == "tool_use":
            self._pending_tool_name = attrs.get("name")
            self._pending_tool_params = None
            self._pending_tool_call_id = attrs.get("call_id") or f"tc-{uuid.uuid4().hex[:8]}"
        return events

    def _close_tag(self, tag_name: str) -> list[dict[str, Any]]:
        if not self._stack:
            return []
        # Find matching opener (or its alias — `</think>` must close `thinking`).
        idx: int | None = None
        for i in range(len(self._stack) - 1, -1, -1):
            if self._stack[i].tag == tag_name:
                idx = i
                break
        if idx is None:
            # No opener in the stack — this is typically a stray / mis-paired
            # close tag. Silently drop it; the next sibling open will still
            # work inside whatever segment is currently on the stack.
            return []

        events: list[dict[str, Any]] = []
        while len(self._stack) - 1 > idx:
            inner = self._stack.pop()
            events.append({"type": "segment_end", "tag": inner.path})

        seg = self._stack.pop()
        # Capture tool_use child data before emitting end.
        if self._stack and self._stack[0].tag == "tool_use":
            if tag_name == "name":
                self._pending_tool_name = seg.buffer.strip() or self._pending_tool_name
            elif tag_name == "params":
                self._pending_tool_params = seg.buffer.strip()

        events.append({"type": "segment_end", "tag": seg.path})

        if tag_name == "tool_use" and not self._stack:
            events.append(self._emit_tool_call_ready())
        return events

    def _emit_tool_call_ready(self) -> dict[str, Any]:
        params_raw = (self._pending_tool_params or "").strip()
        params: dict[str, Any]
        if not params_raw:
            params = {}
        else:
            try:
                parsed = json.loads(params_raw)
                params = parsed if isinstance(parsed, dict) else {"value": parsed}
            except json.JSONDecodeError:
                logger.debug("tool_use params JSON parse failed, raw=%r", params_raw)
                params = {"_raw": params_raw}
        event = {
            "type": "tool_call_ready",
            "tool": self._pending_tool_name or "",
            "params": params,
            "call_id": self._pending_tool_call_id or f"tc-{uuid.uuid4().hex[:8]}",
        }
        self._pending_tool_name = None
        self._pending_tool_params = None
        self._pending_tool_call_id = None
        return event


__all__ = ["XmlStreamParser", "TOP_LEVEL_TAGS"]
