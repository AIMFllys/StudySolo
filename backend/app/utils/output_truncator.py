"""Output truncation utility.

Prevents excessively long LLM outputs from overwhelming context
windows in downstream nodes.
"""


def truncate_output(text: str, max_chars: int = 8000) -> str:
    """Truncate text to max_chars, preserving sentence boundaries.

    If truncation is needed, a marker is appended.
    """
    if len(text) <= max_chars:
        return text

    # Try to cut at last sentence boundary
    truncated = text[:max_chars]
    for boundary in ("。", ".", "！", "!", "？", "?", "\n"):
        idx = truncated.rfind(boundary)
        if idx > max_chars * 0.7:
            truncated = truncated[:idx + 1]
            break

    return truncated + "\n\n…(输出已截断)"
