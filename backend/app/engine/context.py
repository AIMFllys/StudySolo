"""Workflow context management — upstream output routing.

Key improvement: nodes only receive outputs from their DIRECT upstream
connections (via edges), not all previously executed nodes.
"""

from collections import defaultdict


def build_upstream_map(edges: list[dict]) -> dict[str, list[str]]:
    """Build a mapping: target_node_id → [source_node_ids].

    Used by the executor to determine which outputs to pass
    to each node (only direct upstream, not all accumulated).
    """
    upstream: dict[str, list[str]] = defaultdict(list)
    for edge in edges:
        upstream[edge["target"]].append(edge["source"])
    return dict(upstream)


def build_downstream_map(edges: list[dict]) -> dict[str, set[str]]:
    """Build a mapping: source_node_id → {target_node_ids}.

    Used for error propagation: when a node fails, all downstream
    nodes are marked as failed and skipped.
    """
    downstream: dict[str, set[str]] = defaultdict(set)
    for edge in edges:
        downstream[edge["source"]].add(edge["target"])
    return dict(downstream)


def get_all_downstream(node_id: str, downstream_map: dict[str, set[str]]) -> set[str]:
    """Return all transitive downstream node IDs from a given node."""
    from collections import deque

    result: set[str] = set()
    queue = deque(downstream_map.get(node_id, set()))
    while queue:
        nid = queue.popleft()
        if nid not in result:
            result.add(nid)
            queue.extend(downstream_map.get(nid, set()))
    return result
