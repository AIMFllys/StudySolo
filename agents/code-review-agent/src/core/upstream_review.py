from dataclasses import dataclass


UPSTREAM_REVIEW_SYSTEM_PROMPT = """You are StudySolo's code review agent.
Return plain text with exactly these sections in order:
Summary
Findings
Limitations

Only report findings from the review target.
Treat repo context as supporting reference only and never report standalone findings from it.
Keep File lines in the form path:line when a path is available.
If no deterministic finding is justified, say so in the Findings section.
"""


@dataclass(frozen=True, slots=True)
class UpstreamReviewSettings:
    model: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    timeout_seconds: float = 30.0


@dataclass(frozen=True, slots=True)
class UpstreamReviewRequest:
    model: str | None
    base_url: str | None
    api_key: str | None
    timeout_seconds: float
    messages: tuple[dict[str, str], ...]


def build_upstream_review_request(
    *,
    settings: UpstreamReviewSettings,
    input_kind: str,
    review_target_text: str,
    review_target_path: str | None,
    context_blocks: tuple[tuple[str, str], ...],
    uses_structured_input: bool,
) -> UpstreamReviewRequest:
    target_path = review_target_path or "<none>"
    sections = [
        "Review target",
        f"- Input type: {input_kind}",
        f"- Structured input supplied: {'yes' if uses_structured_input else 'no'}",
        f"- Review target path: {target_path}",
        "",
        "Review target content:",
        review_target_text or "<empty>",
        "",
        "Repo context",
        f"- Repo context files supplied: {len(context_blocks)}",
    ]

    for index, (path, content) in enumerate(context_blocks, start=1):
        sections.extend(
            [
                f"- Context file {index} path: {path}",
                "Context content:",
                content or "<empty>",
            ]
        )

    user_prompt = "\n".join(sections)
    return UpstreamReviewRequest(
        model=settings.model,
        base_url=settings.base_url,
        api_key=settings.api_key,
        timeout_seconds=settings.timeout_seconds,
        messages=(
            {"role": "system", "content": UPSTREAM_REVIEW_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ),
    )
