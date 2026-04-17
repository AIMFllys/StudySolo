import pytest

from app.engine.run_worker import _resolve_workflow_input, summarise_progress


class _Result:
    def __init__(self, data):
        self.data = data


class _FakeDb:
    def __init__(self, *, run: dict, nodes: list[dict], events: list[dict]):
        self.run = run
        self.nodes = nodes
        self.events = events

    def from_(self, table: str):
        return _FakeQuery(self, table)


class _FakeQuery:
    def __init__(self, db: _FakeDb, table: str):
        self.db = db
        self.table = table
        self.selected = "*"
        self.filters: list[tuple[str, object]] = []
        self.order_field: str | None = None
        self.order_desc = False
        self.limit_value: int | None = None
        self.range_bounds: tuple[int, int] | None = None

    def select(self, selected: str):
        self.selected = selected
        return self

    def eq(self, key: str, value):
        self.filters.append((key, value))
        return self

    def order(self, field: str, desc: bool = False):
        self.order_field = field
        self.order_desc = desc
        return self

    def limit(self, value: int):
        self.limit_value = value
        return self

    def range(self, start: int, end: int):
        self.range_bounds = (start, end)
        return self

    def maybe_single(self):
        return self

    async def execute(self):
        if self.table == "ss_workflow_runs":
            return _Result(dict(self.db.run))
        if self.table == "ss_workflows":
            return _Result({"nodes_json": list(self.db.nodes)})
        if self.table == "ss_workflow_run_events":
            rows = [dict(row) for row in self.db.events]
            for key, value in self.filters:
                rows = [row for row in rows if row.get(key) == value]
            if self.order_field:
                rows.sort(
                    key=lambda row: row.get(self.order_field) or 0,
                    reverse=self.order_desc,
                )
            if self.range_bounds is not None:
                start, end = self.range_bounds
                rows = rows[start : end + 1]
            if self.limit_value is not None:
                rows = rows[: self.limit_value]
            if self.selected == "payload":
                rows = [{"payload": row.get("payload") or {}} for row in rows]
            return _Result(rows)
        return _Result(None)


def _node(node_id: str, label: str, node_type: str = "summary") -> dict:
    return {"id": node_id, "type": node_type, "data": {"label": label}}


def test_resolve_workflow_input_prefers_chinese_user_content():
    nodes = [
        {
            "id": "input-1",
            "type": "trigger_input",
            "data": {"user_content": "????", "label": "????"},
        }
    ]

    assert _resolve_workflow_input(nodes) == "????"


def test_resolve_workflow_input_falls_back_to_chinese_label():
    nodes = [
        {
            "id": "input-1",
            "type": "trigger_input",
            "data": {"label": "????"},
        }
    ]

    assert _resolve_workflow_input(nodes) == "????"


def test_resolve_workflow_input_returns_none_without_trigger():
    assert _resolve_workflow_input([_node("n1", "????")]) is None


@pytest.mark.asyncio
async def test_summarise_progress_counts_all_done_nodes_beyond_recent_window():
    nodes = [_node(f"n{i}", f"?? {i}") for i in range(1, 251)]
    events = [
        {
            "seq": i,
            "event_type": "node_done",
            "payload": {"node_id": f"n{i}"},
            "created_at": f"2026-04-17T00:{i % 60:02d}:00+00:00",
            "run_id": "run-1",
        }
        for i in range(1, 251)
    ]
    events.append(
        {
            "seq": 251,
            "event_type": "node_input",
            "payload": {"node_id": "n250"},
            "created_at": "2026-04-17T01:00:00+00:00",
            "run_id": "run-1",
        }
    )
    db = _FakeDb(
        run={
            "id": "run-1",
            "workflow_id": "wf-1",
            "status": "running",
            "started_at": "2026-04-17T00:00:00+00:00",
            "completed_at": None,
            "input": "????",
        },
        nodes=nodes,
        events=events,
    )

    progress = await summarise_progress(db, "run-1")

    assert progress["done_nodes"] == 250
    assert progress["percent"] == 100
    assert progress["current_node_id"] == "n250"
    assert progress["current_node_label"] == "?? 250"


@pytest.mark.asyncio
async def test_summarise_progress_uses_workflow_node_label_for_current_node():
    db = _FakeDb(
        run={
            "id": "run-1",
            "workflow_id": "wf-1",
            "status": "running",
            "started_at": "2026-04-17T00:00:00+00:00",
            "completed_at": None,
            "input": None,
        },
        nodes=[_node("n1", "?????"), _node("n2", "?????")],
        events=[
            {
                "seq": 1,
                "event_type": "node_input",
                "payload": {"node_id": "n2"},
                "created_at": "2026-04-17T00:00:01+00:00",
                "run_id": "run-1",
            }
        ],
    )

    progress = await summarise_progress(db, "run-1")

    assert progress["current_node_id"] == "n2"
    assert progress["current_node_label"] == "?????"
    assert progress["done_nodes"] == 0


@pytest.mark.asyncio
async def test_completed_progress_reports_full_completion():
    db = _FakeDb(
        run={
            "id": "run-1",
            "workflow_id": "wf-1",
            "status": "completed",
            "started_at": "2026-04-17T00:00:00+00:00",
            "completed_at": "2026-04-17T00:00:10+00:00",
            "input": None,
        },
        nodes=[_node("n1", "?"), _node("n2", "?"), _node("n3", "?")],
        events=[
            {
                "seq": 1,
                "event_type": "node_done",
                "payload": {"node_id": "n1"},
                "created_at": "2026-04-17T00:00:02+00:00",
                "run_id": "run-1",
            }
        ],
    )

    progress = await summarise_progress(db, "run-1")

    assert progress["done_nodes"] == 3
    assert progress["percent"] == 100
