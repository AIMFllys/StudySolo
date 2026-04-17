import os
import sys
from types import ModuleType, SimpleNamespace
from unittest.mock import AsyncMock


def _install_supabase_stub():
    if "supabase" not in sys.modules:
        stub = ModuleType("supabase")
        stub.AsyncClient = object  # type: ignore[attr-defined]
        stub.create_async_client = AsyncMock()  # type: ignore[attr-defined]
        sys.modules["supabase"] = stub
    for sub in ("supabase._async", "supabase._async.client", "supabase.lib"):
        sys.modules.setdefault(sub, ModuleType(sub))
    async_client_mod = sys.modules["supabase._async.client"]
    if not hasattr(async_client_mod, "AsyncClient"):
        async_client_mod.AsyncClient = object  # type: ignore[attr-defined]


_install_supabase_stub()

import pytest
from fastapi.testclient import TestClient
from tests._helpers import TEST_JWT_SECRET, make_bearer_headers

os.environ.setdefault("JWT_SECRET", TEST_JWT_SECRET)
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")

from app.main import app  # noqa: E402
from app.core import deps  # noqa: E402
from app.api.workflow import canvas as canvas_module  # noqa: E402
from app.middleware import auth as auth_middleware  # noqa: E402

_FAKE_USER = {"id": "user-canvas-001", "email": "canvas@example.com"}
ZH_CANVAS_NAME = "\u753b\u5e03\u6d4b\u8bd5"
ZH_DESCRIPTION = "\u4e2d\u6587\u63cf\u8ff0"
ZH_INPUT = "\u4e2d\u6587\u8f93\u5165"
ZH_GOAL = "\u8bf7\u5e2e\u6211\u5b66\u4e60\u673a\u5668\u5b66\u4e60\u57fa\u7840"
ZH_SUMMARY_LABEL = "\u603b\u7ed3\u5f52\u7eb3"
ZH_SUMMARY = "\u4e2d\u6587\u603b\u7ed3"
ZH_BAD_NODE = "\u574f\u8282\u70b9"


class _FakeDb:
    def __init__(self):
        self.row = {
            "id": "wf-canvas",
            "name": ZH_CANVAS_NAME,
            "description": ZH_DESCRIPTION,
            "nodes_json": [],
            "edges_json": [],
            "updated_at": "t1",
        }
        self.table_name = ""
        self.update_payload = None
        self.auth = SimpleNamespace(get_user=self._get_user)

    async def _get_user(self, _token: str):
        return SimpleNamespace(
            user=SimpleNamespace(id=_FAKE_USER["id"], email=_FAKE_USER["email"], user_metadata={"role": "user"}),
        )

    def from_(self, table: str):
        self.table_name = table
        return self

    def table(self, table: str):
        self.table_name = table
        return self

    def select(self, _cols: str):
        return self

    def eq(self, _key: str, _value):
        return self

    def single(self):
        return self

    def maybe_single(self):
        return self

    def update(self, payload: dict):
        self.update_payload = payload
        return self

    async def execute(self):
        if self.table_name == "user_profiles":
            return SimpleNamespace(data={"tier": "free"})
        if self.update_payload is not None:
            self.row.update(self.update_payload)
            self.row["updated_at"] = "t2"
            self.update_payload = None
            return SimpleNamespace(data=[dict(self.row)])
        return SimpleNamespace(data=dict(self.row))


@pytest.fixture()
def fake_db(monkeypatch):
    db = _FakeDb()

    async def fake_check_workflow_access(workflow_id: str, user_id: str, required_role: str, _db):
        return {"workflow": {"id": workflow_id, "user_id": user_id}, "access_role": "owner"}

    async def fake_get_db():
        return db

    monkeypatch.setattr(canvas_module, "check_workflow_access", fake_check_workflow_access)
    monkeypatch.setattr(auth_middleware, "get_db", fake_get_db)
    app.dependency_overrides[deps.get_db] = fake_get_db
    app.dependency_overrides[deps.get_supabase_client] = lambda: db
    yield db
    app.dependency_overrides.pop(deps.get_db, None)
    app.dependency_overrides.pop(deps.get_supabase_client, None)


@pytest.fixture()
def client():
    return TestClient(app)


def test_canvas_apply_dry_run_returns_real_nodes_without_writing(client, fake_db):
    response = client.post(
        "/api/workflow/wf-canvas/canvas/apply",
        headers=make_bearer_headers(_FAKE_USER["id"], email=_FAKE_USER["email"]),
        json={
            "base_updated_at": "t1",
            "dry_run": True,
            "ops": [
                {
                    "op": "create_node",
                    "client_id": "input_1",
                    "node_type": "trigger_input",
                    "label": ZH_INPUT,
                    "position": {"x": 120, "y": 120},
                    "data": {"user_content": ZH_GOAL},
                },
                {
                    "op": "create_node",
                    "client_id": "summary_1",
                    "node_type": "summary",
                    "label": ZH_SUMMARY_LABEL,
                    "position": {"x": 460, "y": 120},
                },
                {"op": "create_edge", "client_id": "edge_1", "source": "$input_1", "target": "$summary_1"},
            ],
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["dry_run"] is True
    assert payload["node_count"] == 2
    assert payload["edge_count"] == 1
    assert payload["nodes_json"][0]["data"]["user_content"] == ZH_GOAL
    assert fake_db.row["nodes_json"] == []


def test_canvas_apply_writes_nodes_and_get_canvas_reads_them(client, fake_db):
    response = client.post(
        "/api/workflow/wf-canvas/canvas/apply",
        headers=make_bearer_headers(_FAKE_USER["id"], email=_FAKE_USER["email"]),
        json={
            "base_updated_at": "t1",
            "dry_run": False,
            "ops": [{"op": "create_node", "client_id": "s1", "node_type": "summary", "label": ZH_SUMMARY}],
        },
    )

    assert response.status_code == 200
    assert fake_db.row["nodes_json"][0]["data"]["label"] == ZH_SUMMARY
    assert fake_db.row["updated_at"] == "t2"

    get_response = client.get(
        "/api/workflow/wf-canvas/canvas",
        headers=make_bearer_headers(_FAKE_USER["id"], email=_FAKE_USER["email"]),
    )
    assert get_response.status_code == 200
    assert get_response.json()["node_count"] == 1


def test_canvas_apply_rejects_stale_base_updated_at(client, fake_db):
    response = client.post(
        "/api/workflow/wf-canvas/canvas/apply",
        headers=make_bearer_headers(_FAKE_USER["id"], email=_FAKE_USER["email"]),
        json={
            "base_updated_at": "stale",
            "ops": [{"op": "create_node", "node_type": "summary", "label": ZH_SUMMARY_LABEL}],
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "workflow_conflict"
    assert fake_db.row["nodes_json"] == []


def test_canvas_validate_reports_invalid_patch_without_writing(client, fake_db):
    response = client.post(
        "/api/workflow/wf-canvas/canvas/validate",
        headers=make_bearer_headers(_FAKE_USER["id"], email=_FAKE_USER["email"]),
        json={"ops": [{"op": "create_node", "node_type": "not_real", "label": ZH_BAD_NODE}]},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["valid"] is False
    assert payload["issues"][0]["code"] == "unknown_node_type"
    assert fake_db.row["nodes_json"] == []
