import importlib
from unittest.mock import AsyncMock, MagicMock

import pytest


_ADMIN_API_MODULES = (
    "app.api.admin_auth",
    "app.api.admin_config",
    "app.api.admin_models",
    "app.api.admin_notices",
    "app.api.admin_users",
)


def _make_admin_middleware_db(base_db):
    account_result = MagicMock()
    account_result.data = {"id": "test-admin-id", "is_active": True}

    account_chain = MagicMock()
    account_chain.select = MagicMock(return_value=account_chain)
    account_chain.eq = MagicMock(return_value=account_chain)
    account_chain.maybe_single = MagicMock(return_value=account_chain)
    account_chain.execute = AsyncMock(return_value=account_result)

    def _table(table_name: str):
        if table_name == "ss_admin_accounts":
            table = MagicMock()
            table.select = MagicMock(return_value=account_chain)
            return table
        return base_db.table(table_name)

    proxy = MagicMock(wraps=base_db)
    proxy.table = MagicMock(side_effect=_table)
    return proxy


@pytest.fixture(autouse=True)
def _align_admin_runtime_with_test_overrides(request, monkeypatch):
    module_name = getattr(request.module, "__name__", "")
    if "test_admin_" not in module_name:
        return

    app = getattr(request.module, "app", None)
    dependency_get_db = getattr(request.module, "get_db", None)
    if app is None or dependency_get_db is None:
        return

    async def _override_aware_get_db():
        override = app.dependency_overrides.get(dependency_get_db)
        if override is not None:
            return _make_admin_middleware_db(await override())
        return await dependency_get_db()

    admin_auth_middleware = importlib.import_module("app.middleware.admin_auth")
    monkeypatch.setattr(admin_auth_middleware, "get_db", _override_aware_get_db)

    for module_path in _ADMIN_API_MODULES:
        module = importlib.import_module(module_path)
        if hasattr(module, "queue_audit_log"):
            monkeypatch.setattr(module, "queue_audit_log", lambda *args, **kwargs: None)
