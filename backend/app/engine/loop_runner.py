"""Loop group container execution — iterates a child subgraph N times."""

import asyncio
import json
from typing import AsyncIterator

from app.engine.context import build_upstream_map
from app.engine.events import sse_event
from app.engine.node_runner import execute_single_node_with_timeout
from app.engine.topology import topological_sort_levels, MAX_WAIT_SECONDS


async def execute_loop_group(
    group_node: dict,
    all_nodes: list[dict],
    all_edges: list[dict],
    implicit_context: dict | None,
    accumulated_outputs: dict[str, str],
) -> AsyncIterator[str]:
    """Execute a loop_group container: iterate its child subgraph N times."""
    group_id = group_node["id"]
    group_data = group_node.get("data", {})
    max_iterations = min(int(group_data.get("maxIterations", 3)), 100)
    interval_seconds = min(float(group_data.get("intervalSeconds", 0)), MAX_WAIT_SECONDS)

    child_nodes = [n for n in all_nodes if n.get("parentId") == group_id]
    child_ids = {n["id"] for n in child_nodes}
    child_edges = [
        e for e in all_edges
        if e["source"] in child_ids and e["target"] in child_ids
    ]

    if not child_nodes:
        yield sse_event("node_done", {"node_id": group_id, "full_output": "[循环块无子节点]"})
        return

    iteration_results: list[dict[str, str]] = []

    for iteration in range(1, max_iterations + 1):
        yield sse_event("loop_iteration", {
            "group_id": group_id,
            "iteration": iteration,
            "total": max_iterations,
        })

        try:
            sub_levels = topological_sort_levels(child_nodes, child_edges)
        except ValueError:
            yield sse_event("node_status", {
                "node_id": group_id, "status": "error",
                "error": "循环块内部存在环",
            })
            return

        iter_outputs = dict(accumulated_outputs)
        if iteration_results:
            iter_outputs.update(iteration_results[-1])

        sub_outputs: dict[str, str] = {}
        sub_failed: set[str] = set()
        upstream_map = build_upstream_map(child_edges)

        for level in sub_levels:
            tasks = []
            for nid in level:
                if nid in sub_failed:
                    continue
                node_cfg = next((n for n in child_nodes if n["id"] == nid), None)
                if not node_cfg:
                    continue

                direct_ups = upstream_map.get(nid, [])
                ups = {
                    uid: sub_outputs.get(uid, iter_outputs.get(uid, ""))
                    for uid in direct_ups
                }

                tasks.append(asyncio.create_task(
                    execute_single_node_with_timeout(nid, node_cfg, ups, implicit_context)
                ))

            if tasks:
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for res in results:
                    if isinstance(res, Exception):
                        continue
                    nid, output, error = res
                    if error:
                        sub_failed.add(nid)
                    elif output is not None:
                        sub_outputs[nid] = output

        iteration_results.append(sub_outputs)

        if interval_seconds > 0 and iteration < max_iterations:
            await asyncio.sleep(interval_seconds)

    final_output = json.dumps(iteration_results, ensure_ascii=False, indent=2)
    accumulated_outputs[group_id] = final_output
