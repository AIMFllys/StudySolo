import sys
from types import ModuleType

if "mcp.types" not in sys.modules:
    mcp_mod = ModuleType("mcp")
    types_mod = ModuleType("mcp.types")

    class Tool:  # minimal test stub
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)

    types_mod.Tool = Tool
    sys.modules["mcp"] = mcp_mod
    sys.modules["mcp.types"] = types_mod

import asyncio

from studysolo_mcp.tools import canvas

ZH_WORKFLOW = "\u4e2d\u6587\u5de5\u4f5c\u6d41"
ZH_DESCRIPTION = "\u4e2d\u6587\u63cf\u8ff0"
ZH_INPUT = "\u4e2d\u6587\u8f93\u5165"
ZH_SUMMARY = "\u4e2d\u6587\u603b\u7ed3"


class FakeClient:
    def __init__(self):
        self.calls = []
        self.canvas = {
            "nodes_json": [
                {"id": "input", "type": "trigger_input", "data": {"label": ZH_INPUT}},
                {"id": "summary", "type": "summary", "data": {"label": ZH_SUMMARY}},
            ],
            "edges_json": [{"id": "e1", "source": "input", "target": "summary"}],
        }

    async def get(self, path, *, params=None):
        self.calls.append(("GET", path, params))
        if path.endswith("/canvas"):
            return self.canvas
        return {"path": path}

    async def post(self, path, *, json_body=None):
        self.calls.append(("POST", path, json_body))
        return {"path": path, "json": json_body}


def run(coro):
    return asyncio.run(coro)


def test_create_workflow_posts_name_and_chinese_description():
    client = FakeClient()

    result = run(canvas.create_workflow(client, {"name": ZH_WORKFLOW, "description": ZH_DESCRIPTION}))

    assert result["path"] == "/api/workflow"
    assert result["json"] == {"name": ZH_WORKFLOW, "description": ZH_DESCRIPTION}


def test_apply_workflow_canvas_patch_posts_ops_to_canvas_endpoint():
    client = FakeClient()
    ops = [{"op": "create_node", "node_type": "summary", "label": ZH_SUMMARY}]

    result = run(canvas.apply_workflow_canvas_patch(client, {"workflow_id": "wf", "base_updated_at": "t1", "dry_run": True, "ops": ops}))

    assert result["path"] == "/api/workflow/wf/canvas/apply"
    assert result["json"] == {"ops": ops, "base_updated_at": "t1", "dry_run": True}


def test_get_workflow_node_returns_node_and_edges():
    client = FakeClient()

    result = run(canvas.get_workflow_node(client, {"workflow_id": "wf", "node_id": "summary"}))

    assert result["node"]["data"]["label"] == ZH_SUMMARY
    assert result["incoming_edges"] == [{"id": "e1", "source": "input", "target": "summary"}]
    assert result["outgoing_edges"] == []


def test_get_node_config_options_quotes_path_parts():
    client = FakeClient()

    result = run(canvas.get_node_config_options(client, {"node_type": "knowledge_base", "field_key": "document_ids"}))

    assert result["path"] == "/api/nodes/config-options/knowledge_base/document_ids"
