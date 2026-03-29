"""Level execution helpers — single-node streaming and parallel dispatch."""

import asyncio
import json
import logging
from typing import AsyncIterator

from app.engine.context import get_all_downstream
from app.engine.events import sse_event
from app.engine.loop_runner import execute_loop_group
from app.engine.node_runner import (
    DEFAULT_NODE_TIMEOUT,
    build_input_snapshot,
    build_node_llm_caller,
    build_runtime_config,
    execute_single_node_with_timeout,
    resolve_user_content,
)
from app.engine.topology import get_branch_filtered_downstream, get_max_wait_seconds
from app.nodes import NODE_REGISTRY
from app.nodes._base import NodeInput
from app.services.ai_router import AIRouterError
from app.services.usage_ledger import bind_usage_call

logger = logging.getLogger(__name__)


async def execute_single_level_node(
    node_id: str,
    node_map: dict[str, dict],
    all_nodes: list[dict],
    edges: list[dict],
    upstream_map: dict,
    downstream_map: dict,
    implicit_context: dict | None,
    accumulated_outputs: dict[str, str],
    failed_nodes: set[str],
    skipped_nodes: set[str],
) -> AsyncIterator[str]:
    """Execute a single node at a topological level with full SSE streaming."""
    node_cfg = node_map.get(node_id)
    if not node_cfg:
        return

    node_type_str = node_cfg.get("type", "chat_response")
    node_data = node_cfg.get("data", {})

    if node_type_str == "loop_group":
        yield sse_event("node_status", {"node_id": node_id, "status": "running"})
        async for event in execute_loop_group(
            node_cfg, all_nodes, edges, implicit_context, accumulated_outputs,
        ):
            yield event
        yield sse_event("node_done", {
            "node_id": node_id,
            "full_output": accumulated_outputs.get(node_id, ""),
        })
        yield sse_event("node_status", {"node_id": node_id, "status": "done"})
        return

    wait_secs = get_max_wait_seconds(node_id, edges)
    if wait_secs > 0:
        yield sse_event("node_status", {"node_id": node_id, "status": "waiting"})
        await asyncio.sleep(wait_secs)

    yield sse_event("node_status", {"node_id": node_id, "status": "running"})

    NodeClass = NODE_REGISTRY.get(node_type_str)
    if not NodeClass:
        NodeClass = NODE_REGISTRY.get("chat_response")
        if not NodeClass:
            yield sse_event("node_status", {
                "node_id": node_id, "status": "error",
                "error": f"Unknown node type: {node_type_str}",
            })
            failed_nodes.update(get_all_downstream(node_id, downstream_map))
            return

    node_instance = NodeClass()
    runtime_config = build_runtime_config(node_data)
    direct_upstream_ids = upstream_map.get(node_id, [])
    upstream_outputs = {
        uid: accumulated_outputs[uid] for uid in direct_upstream_ids if uid in accumulated_outputs
    }

    node_input = NodeInput(
        user_content=resolve_user_content(node_data),
        upstream_outputs=upstream_outputs,
        implicit_context=implicit_context,
        node_config=runtime_config,
    )

    try:
        yield sse_event("node_input", {"node_id": node_id, "input_snapshot": build_input_snapshot(node_input)})
    except Exception as e:
        logger.warning("Failed to serialize input snapshot for node %s: %s", node_id, e)

    full_output = ""
    try:
        with bind_usage_call(node_id=node_id, node_type=node_type_str):
            async for token in node_instance.execute(node_input, build_node_llm_caller(runtime_config)):
                full_output += token
                yield sse_event("node_token", {"node_id": node_id, "token": token})

        result = await node_instance.post_process(full_output)
        accumulated_outputs[node_id] = result.content
        yield sse_event("node_done", {"node_id": node_id, "full_output": result.content})
        yield sse_event("node_status", {"node_id": node_id, "status": "done"})

        if node_type_str == "logic_switch" and result.metadata.get("branch"):
            chosen_branch = result.metadata["branch"]
            branch_skips = get_branch_filtered_downstream(node_id, chosen_branch, edges, downstream_map)
            skipped_nodes.update(branch_skips)
            logger.info("logic_switch %s chose branch '%s', skipping %d nodes", node_id, chosen_branch, len(branch_skips))

    except (AIRouterError, Exception) as e:
        logger.error("Node %s execution failed: %s", node_id, e)
        yield sse_event("node_status", {"node_id": node_id, "status": "error", "error": str(e)})
        failed_nodes.update(get_all_downstream(node_id, downstream_map))


async def execute_parallel_level(
    active_nodes: list[str],
    node_map: dict[str, dict],
    edges: list[dict],
    upstream_map: dict,
    downstream_map: dict,
    implicit_context: dict | None,
    accumulated_outputs: dict[str, str],
    failed_nodes: set[str],
    skipped_nodes: set[str],
) -> AsyncIterator[str]:
    """Execute multiple independent nodes in parallel."""
    for nid in active_nodes:
        yield sse_event("node_status", {"node_id": nid, "status": "running"})

    tasks: list[asyncio.Task] = []
    for nid in active_nodes:
        node_cfg = node_map.get(nid)
        if not node_cfg:
            continue
        direct_upstream_ids = upstream_map.get(nid, [])
        upstream_outputs = {uid: accumulated_outputs[uid] for uid in direct_upstream_ids if uid in accumulated_outputs}
        node_data = node_cfg.get("data", {})
        node_input = NodeInput(
            user_content=resolve_user_content(node_data),
            upstream_outputs=upstream_outputs,
            implicit_context=implicit_context,
            node_config=build_runtime_config(node_data),
        )
        try:
            yield sse_event("node_input", {"node_id": nid, "input_snapshot": build_input_snapshot(node_input)})
        except Exception as e:
            logger.warning("Failed to serialize input snapshot for node %s: %s", nid, e)

        tasks.append(asyncio.create_task(
            execute_single_node_with_timeout(
                node_id=nid, node_config=node_cfg,
                upstream_outputs=upstream_outputs, implicit_context=implicit_context,
                timeout_seconds=DEFAULT_NODE_TIMEOUT,
            )
        ))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    for res in results:
        if isinstance(res, Exception):
            logger.error("Parallel task exception: %s", res)
            continue
        nid, output, error = res
        if error:
            yield sse_event("node_status", {"node_id": nid, "status": "error", "error": error})
            failed_nodes.update(get_all_downstream(nid, downstream_map))
        else:
            accumulated_outputs[nid] = output
            yield sse_event("node_done", {"node_id": nid, "full_output": output})
            yield sse_event("node_status", {"node_id": nid, "status": "done"})
            node_cfg = node_map.get(nid, {})
            if node_cfg.get("type") == "logic_switch":
                try:
                    parsed = json.loads(output)
                    if isinstance(parsed, dict) and "branch" in parsed:
                        skipped_nodes.update(get_branch_filtered_downstream(nid, parsed["branch"], edges, downstream_map))
                except (json.JSONDecodeError, TypeError):
                    pass
