from collections import defaultdict
from datetime import datetime, timedelta, timezone
from statistics import quantiles

from supabase import AsyncClient

from app.models.usage import (
    CostSplitItem,
    CostSplitResponse,
    ModelBreakdownItem,
    ModelBreakdownResponse,
    RecentCallItem,
    RecentCallsResponse,
    UsageLivePoint,
    UsageLiveResponse,
    UsageMetrics,
    UsageOverviewResponse,
    UsageTimeseriesPoint,
    UsageTimeseriesResponse,
)

UTC = timezone.utc


def _utcnow() -> datetime:
    return datetime.now(UTC)


def parse_range(range_value: str) -> timedelta:
    mapping = {
        "24h": timedelta(hours=24),
        "7d": timedelta(days=7),
        "30d": timedelta(days=30),
        "90d": timedelta(days=90),
    }
    return mapping[range_value]


def parse_window(window_value: str) -> timedelta:
    mapping = {
        "5m": timedelta(minutes=5),
        "60m": timedelta(minutes=60),
    }
    return mapping[window_value]


def _bucket_key(ts: datetime, range_value: str) -> str:
    if range_value == "24h":
        return ts.astimezone(UTC).replace(minute=0, second=0, microsecond=0).isoformat()
    return ts.astimezone(UTC).date().isoformat()


def _bucket_sequence(range_value: str) -> list[str]:
    now = _utcnow()
    if range_value == "24h":
        start = (now - timedelta(hours=23)).replace(minute=0, second=0, microsecond=0)
        return [(start + timedelta(hours=offset)).isoformat() for offset in range(24)]

    days = 7 if range_value == "7d" else 30
    start_date = (now - timedelta(days=days - 1)).date()
    return [(start_date + timedelta(days=offset)).isoformat() for offset in range(days)]


def _window_sequence(window_value: str) -> list[datetime]:
    now = _utcnow().replace(second=0, microsecond=0)
    minutes = 5 if window_value == "5m" else 60
    start = now - timedelta(minutes=minutes - 1)
    return [start + timedelta(minutes=offset) for offset in range(minutes)]


def _safe_int(value: object) -> int:
    return int(value or 0)


def _safe_float(value: object) -> float:
    return float(value or 0.0)


def _compute_metrics(request_rows: list[dict], event_rows: list[dict], source_type: str | None) -> UsageMetrics:
    filtered_requests = [
        row for row in request_rows
        if source_type is None or row.get("source_type") == source_type
    ]
    filtered_events = [
        row for row in event_rows
        if source_type is None or row.get("source_type") == source_type
    ]
    provider_call_count = len(filtered_events)
    successful_events = [row for row in filtered_events if row.get("status") == "success"]
    successful_provider_call_count = len(successful_events)
    error_count = provider_call_count - successful_provider_call_count
    fallback_count = sum(1 for row in filtered_events if bool(row.get("is_fallback")))
    latencies = [
        _safe_int(row.get("latency_ms"))
        for row in successful_events
        if row.get("latency_ms") is not None
    ]

    p95_latency_ms: int | None = None
    if len(latencies) == 1:
        p95_latency_ms = latencies[0]
    elif len(latencies) > 1:
        p95_latency_ms = int(quantiles(latencies, n=100, method="inclusive")[94])

    return UsageMetrics(
        logical_request_count=len(filtered_requests),
        provider_call_count=provider_call_count,
        successful_provider_call_count=successful_provider_call_count,
        total_tokens=sum(_safe_int(row.get("total_tokens")) for row in successful_events),
        total_cost_cny=round(sum(_safe_float(row.get("cost_amount_cny")) for row in successful_events), 6),
        error_rate=round(error_count / provider_call_count, 4) if provider_call_count else 0.0,
        fallback_rate=round(fallback_count / provider_call_count, 4) if provider_call_count else 0.0,
        p95_latency_ms=p95_latency_ms,
    )


async def _fetch_request_rows(
    db: AsyncClient,
    *,
    cutoff: datetime,
    user_id: str | None = None,
) -> list[dict]:
    query = (
        db.table("ss_ai_requests")
        .select("id, source_type, source_subtype, status, started_at")
        .gte("started_at", cutoff.isoformat())
    )
    if user_id:
        query = query.eq("user_id", user_id)
    result = await query.execute()
    return result.data or []


async def _fetch_event_rows(
    db: AsyncClient,
    *,
    cutoff: datetime,
    user_id: str | None = None,
    source_filter: str = "all",
) -> list[dict]:
    query = (
        db.table("ss_ai_usage_events")
        .select(
            "id, request_id, source_type, source_subtype, sku_id, family_id, provider, vendor, model, "
            "billing_channel, node_id, status, is_fallback, latency_ms, total_tokens, cost_amount_cny, started_at"
        )
        .gte("started_at", cutoff.isoformat())
    )
    if user_id:
        query = query.eq("user_id", user_id)
    if source_filter != "all":
        query = query.eq("source_type", source_filter)
    result = await query.order("started_at", desc=False).execute()
    return result.data or []


async def _fetch_family_map(db: AsyncClient) -> dict[str, dict]:
    result = (
        await db.table("ai_model_families")
        .select("id, task_family, family_name")
        .execute()
    )
    return {
        str(row["id"]): row
        for row in (result.data or [])
    }


async def get_usage_overview(
    db: AsyncClient,
    *,
    range_value: str,
    user_id: str | None = None,
) -> UsageOverviewResponse:
    cutoff = _utcnow() - parse_range(range_value)
    request_rows = await _fetch_request_rows(db, cutoff=cutoff, user_id=user_id)
    event_rows = await _fetch_event_rows(db, cutoff=cutoff, user_id=user_id)
    return UsageOverviewResponse(
        range=range_value,
        assistant=_compute_metrics(request_rows, event_rows, "assistant"),
        workflow=_compute_metrics(request_rows, event_rows, "workflow"),
        all=_compute_metrics(request_rows, event_rows, None),
    )


async def get_usage_live(
    db: AsyncClient,
    *,
    window_value: str,
    user_id: str | None = None,
) -> UsageLiveResponse:
    cutoff = _utcnow() - parse_window(window_value)
    query = (
        db.table("ss_ai_usage_minute")
        .select(
            "minute_bucket, logical_requests, provider_calls, successful_provider_calls, total_tokens, "
            "total_cost_cny, error_count, fallback_count"
        )
        .gte("minute_bucket", cutoff.replace(second=0, microsecond=0).isoformat())
    )
    if user_id:
        query = query.eq("user_id", user_id)
    result = await query.order("minute_bucket", desc=False).execute()
    buckets: dict[str, dict[str, float]] = defaultdict(
        lambda: {
            "logical_requests": 0,
            "provider_calls": 0,
            "successful_provider_calls": 0,
            "total_tokens": 0,
            "total_cost_cny": 0.0,
            "error_count": 0,
            "fallback_count": 0,
        }
    )
    for row in result.data or []:
        key = str(row["minute_bucket"])
        current = buckets[key]
        current["logical_requests"] += _safe_int(row.get("logical_requests"))
        current["provider_calls"] += _safe_int(row.get("provider_calls"))
        current["successful_provider_calls"] += _safe_int(row.get("successful_provider_calls"))
        current["total_tokens"] += _safe_int(row.get("total_tokens"))
        current["total_cost_cny"] += _safe_float(row.get("total_cost_cny"))
        current["error_count"] += _safe_int(row.get("error_count"))
        current["fallback_count"] += _safe_int(row.get("fallback_count"))

    points: list[UsageLivePoint] = []
    for bucket_time in _window_sequence(window_value):
        current = buckets.get(bucket_time.isoformat(), {})
        points.append(
            UsageLivePoint(
                ts=bucket_time,
                logical_requests=_safe_int(current.get("logical_requests")),
                provider_calls=_safe_int(current.get("provider_calls")),
                successful_provider_calls=_safe_int(current.get("successful_provider_calls")),
                total_tokens=_safe_int(current.get("total_tokens")),
                total_cost_cny=round(_safe_float(current.get("total_cost_cny")), 6),
                error_count=_safe_int(current.get("error_count")),
                fallback_count=_safe_int(current.get("fallback_count")),
            )
        )

    provider_calls = sum(point.provider_calls for point in points)
    error_count = sum(point.error_count for point in points)
    fallback_count = sum(point.fallback_count for point in points)
    summary = UsageMetrics(
        logical_request_count=sum(point.logical_requests for point in points),
        provider_call_count=provider_calls,
        successful_provider_call_count=sum(point.successful_provider_calls for point in points),
        total_tokens=sum(point.total_tokens for point in points),
        total_cost_cny=round(sum(point.total_cost_cny for point in points), 6),
        error_rate=round(error_count / provider_calls, 4) if provider_calls else 0.0,
        fallback_rate=round(fallback_count / provider_calls, 4) if provider_calls else 0.0,
        p95_latency_ms=None,
    )
    return UsageLiveResponse(window=window_value, points=points, summary=summary)


async def get_usage_timeseries(
    db: AsyncClient,
    *,
    range_value: str,
    user_id: str | None = None,
    source_filter: str = "all",
) -> UsageTimeseriesResponse:
    cutoff = _utcnow() - parse_range(range_value)
    rows = await _fetch_event_rows(db, cutoff=cutoff, user_id=user_id, source_filter=source_filter)
    buckets: dict[str, UsageTimeseriesPoint] = {
        key: UsageTimeseriesPoint(ts=key)
        for key in _bucket_sequence(range_value)
    }
    for row in rows:
        started_at = datetime.fromisoformat(str(row["started_at"]).replace("Z", "+00:00"))
        bucket = _bucket_key(started_at, range_value)
        point = buckets.setdefault(bucket, UsageTimeseriesPoint(ts=bucket))
        tokens = _safe_int(row.get("total_tokens")) if row.get("status") == "success" else 0
        cost = _safe_float(row.get("cost_amount_cny")) if row.get("status") == "success" else 0.0
        if row.get("source_type") == "assistant":
            point.assistant_calls += 1
            point.assistant_tokens += tokens
            point.assistant_cost_cny = round(point.assistant_cost_cny + cost, 6)
        elif row.get("source_type") == "workflow":
            point.workflow_calls += 1
            point.workflow_tokens += tokens
            point.workflow_cost_cny = round(point.workflow_cost_cny + cost, 6)
    return UsageTimeseriesResponse(range=range_value, source=source_filter, points=list(buckets.values()))


async def get_model_breakdown(
    db: AsyncClient,
    *,
    range_value: str,
    user_id: str | None = None,
    source_filter: str = "all",
) -> ModelBreakdownResponse:
    cutoff = _utcnow() - parse_range(range_value)
    rows = await _fetch_event_rows(db, cutoff=cutoff, user_id=user_id, source_filter=source_filter)
    family_map = await _fetch_family_map(db)
    grouped: dict[tuple[str, str, str, str, str], dict[str, float | str | None]] = defaultdict(
        lambda: {
            "provider_call_count": 0,
            "successful_provider_call_count": 0,
            "total_tokens": 0,
            "total_cost_cny": 0.0,
            "sku_id": None,
            "family_id": None,
            "vendor": "__unknown__",
            "billing_channel": "unknown",
        }
    )
    for row in rows:
        provider = str(row.get("provider") or "__unknown__")
        vendor = str(row.get("vendor") or "__unknown__")
        model = str(row.get("model") or "__unknown__")
        billing_channel = str(row.get("billing_channel") or "unknown")
        family_id = str(row.get("family_id") or "")
        key = (provider, vendor, model, billing_channel, family_id)
        grouped[key]["provider_call_count"] += 1
        grouped[key]["sku_id"] = row.get("sku_id")
        grouped[key]["family_id"] = row.get("family_id")
        grouped[key]["vendor"] = vendor
        grouped[key]["billing_channel"] = billing_channel
        if row.get("status") == "success":
            grouped[key]["successful_provider_call_count"] += 1
            grouped[key]["total_tokens"] += _safe_int(row.get("total_tokens"))
            grouped[key]["total_cost_cny"] += _safe_float(row.get("cost_amount_cny"))

    items = [
        ModelBreakdownItem(
            sku_id=str(values["sku_id"]) if values.get("sku_id") else None,
            family_id=str(values["family_id"]) if values.get("family_id") else None,
            provider=provider,
            vendor=str(values["vendor"]),
            model=model,
            billing_channel=str(values["billing_channel"]),
            task_family=family_map.get(family_id, {}).get("task_family"),
            provider_call_count=int(values["provider_call_count"]),
            successful_provider_call_count=int(values["successful_provider_call_count"]),
            total_tokens=int(values["total_tokens"]),
            total_cost_cny=round(float(values["total_cost_cny"]), 6),
            success_rate=round(
                float(values["successful_provider_call_count"]) / float(values["provider_call_count"]),
                4,
            ) if values["provider_call_count"] else 0.0,
        )
        for (provider, _vendor, model, _billing_channel, family_id), values in grouped.items()
    ]
    items.sort(key=lambda item: (item.total_cost_cny, item.total_tokens, item.provider_call_count), reverse=True)
    return ModelBreakdownResponse(range=range_value, source=source_filter, items=items)


async def get_recent_calls(
    db: AsyncClient,
    *,
    limit: int,
    user_id: str | None = None,
) -> RecentCallsResponse:
    query = (
        db.table("ss_ai_usage_events")
        .select(
            "id, request_id, source_type, source_subtype, sku_id, family_id, provider, vendor, model, "
            "billing_channel, node_id, status, is_fallback, latency_ms, total_tokens, cost_amount_cny, started_at"
        )
        .order("started_at", desc=True)
        .limit(limit)
    )
    if user_id:
        query = query.eq("user_id", user_id)
    result = await query.execute()
    return RecentCallsResponse(
        calls=[
            RecentCallItem(
                id=str(row["id"]),
                request_id=str(row["request_id"]),
                source_type=row["source_type"],
                source_subtype=row["source_subtype"],
                sku_id=str(row["sku_id"]) if row.get("sku_id") else None,
                family_id=str(row["family_id"]) if row.get("family_id") else None,
                provider=str(row.get("provider") or "__unknown__"),
                vendor=str(row.get("vendor") or "__unknown__"),
                model=str(row.get("model") or "__unknown__"),
                billing_channel=str(row.get("billing_channel") or "unknown"),
                node_id=row.get("node_id"),
                status=row.get("status") or "error",
                is_fallback=bool(row.get("is_fallback")),
                latency_ms=_safe_int(row.get("latency_ms")) if row.get("latency_ms") is not None else None,
                total_tokens=_safe_int(row.get("total_tokens")),
                cost_amount_cny=round(_safe_float(row.get("cost_amount_cny")), 6),
                started_at=datetime.fromisoformat(str(row["started_at"]).replace("Z", "+00:00")),
            )
            for row in (result.data or [])
        ]
    )


async def get_cost_split(
    db: AsyncClient,
    *,
    range_value: str,
    user_id: str | None = None,
) -> CostSplitResponse:
    cutoff = _utcnow() - parse_range(range_value)
    rows = await _fetch_event_rows(db, cutoff=cutoff, user_id=user_id)
    grouped: dict[str, dict[str, float]] = defaultdict(
        lambda: {
            "provider_call_count": 0,
            "total_tokens": 0,
            "total_cost_cny": 0.0,
        }
    )
    for row in rows:
        source_type = str(row.get("source_type") or "assistant")
        grouped[source_type]["provider_call_count"] += 1
        if row.get("status") == "success":
            grouped[source_type]["total_tokens"] += _safe_int(row.get("total_tokens"))
            grouped[source_type]["total_cost_cny"] += _safe_float(row.get("cost_amount_cny"))
    items = [
        CostSplitItem(
            source_type=source_type,  # type: ignore[arg-type]
            provider_call_count=int(values["provider_call_count"]),
            total_tokens=int(values["total_tokens"]),
            total_cost_cny=round(float(values["total_cost_cny"]), 6),
        )
        for source_type, values in grouped.items()
    ]
    items.sort(key=lambda item: item.source_type)
    return CostSplitResponse(range=range_value, items=items)
