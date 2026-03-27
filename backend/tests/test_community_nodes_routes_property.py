from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from fastapi.testclient import TestClient

from app.api import community_nodes as community_nodes_api
from app.core import deps
from app.main import app
from app.middleware import auth as auth_middleware


_USER = {"id": "user-1", "email": "user@example.com", "role": "user", "tier": "free"}


def _make_auth_db():
    auth_db = MagicMock()
    auth_db.auth.get_user = AsyncMock(
        return_value=SimpleNamespace(
            user=SimpleNamespace(
                id=_USER["id"],
                email=_USER["email"],
                user_metadata={"role": _USER["role"]},
            )
        )
    )
    return auth_db


def _auth_headers() -> dict[str, str]:
    return {"Authorization": "Bearer test-token"}


def test_community_node_list_accepts_slashless_root(monkeypatch):
    list_public_nodes = AsyncMock(
        return_value={
            "items": [],
            "total": 0,
            "page": 1,
            "pages": 1,
        }
    )

    async def _override_auth_db():
        return _make_auth_db()

    monkeypatch.setattr(auth_middleware, "get_db", _override_auth_db)
    monkeypatch.setattr(community_nodes_api, "list_public_nodes", list_public_nodes)
    app.dependency_overrides[deps.get_optional_user] = lambda: None
    app.dependency_overrides[deps.get_supabase_client] = lambda: MagicMock()

    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get(
            "/api/community-nodes?page=1&per_page=10&sort=likes",
            headers=_auth_headers(),
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"items": [], "total": 0, "page": 1, "pages": 1}
    list_public_nodes.assert_awaited_once()


def test_publish_community_node_accepts_slashless_root(monkeypatch):
    created_at = datetime.now(timezone.utc).isoformat()
    create_node = AsyncMock(
        return_value={
            "id": "node-1",
            "author_id": _USER["id"],
            "author_name": "self",
            "name": "Test Node",
            "description": "Published from slashless route",
            "icon": "Bot",
            "category": "other",
            "version": "1.0.0",
            "input_hint": "",
            "output_format": "markdown",
            "output_schema": None,
            "model_preference": "auto",
            "knowledge_file_name": None,
            "knowledge_file_size": 0,
            "likes_count": 0,
            "install_count": 0,
            "is_liked": False,
            "created_at": created_at,
            "prompt": "system prompt",
            "status": "approved",
            "reject_reason": None,
        }
    )

    async def _override_auth_db():
        return _make_auth_db()

    monkeypatch.setattr(auth_middleware, "get_db", _override_auth_db)
    monkeypatch.setattr(community_nodes_api, "create_node", create_node)
    app.dependency_overrides[deps.get_current_user] = lambda: _USER
    app.dependency_overrides[deps.get_supabase_client] = lambda: MagicMock()

    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.post(
            "/api/community-nodes",
            headers=_auth_headers(),
            data={
                "name": "Test Node",
                "description": "Published from slashless route",
                "prompt": "system prompt",
            },
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["id"] == "node-1"
    create_node.assert_awaited_once()


def test_get_my_node_detail_returns_owner_payload(monkeypatch):
    get_my_node = AsyncMock(
        return_value={
            "id": "node-1",
            "author_id": _USER["id"],
            "author_name": "self",
            "name": "Owned Node",
            "description": "Editable by author",
            "icon": "Bot",
            "category": "other",
            "version": "1.0.0",
            "input_hint": "",
            "output_format": "markdown",
            "output_schema": None,
            "model_preference": "auto",
            "knowledge_file_name": None,
            "knowledge_file_size": 0,
            "likes_count": 0,
            "install_count": 0,
            "is_liked": False,
            "is_owner": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "prompt": "secret prompt",
            "status": "approved",
            "reject_reason": None,
        }
    )

    async def _override_auth_db():
        return _make_auth_db()

    monkeypatch.setattr(auth_middleware, "get_db", _override_auth_db)
    monkeypatch.setattr(community_nodes_api, "get_my_node", get_my_node)
    app.dependency_overrides[deps.get_current_user] = lambda: _USER
    app.dependency_overrides[deps.get_supabase_client] = lambda: MagicMock()

    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get(
            "/api/community-nodes/mine/node-1",
            headers=_auth_headers(),
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["is_owner"] is True
    assert response.json()["prompt"] == "secret prompt"
    get_my_node.assert_awaited_once()
