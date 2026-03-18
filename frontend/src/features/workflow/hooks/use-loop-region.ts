'use client';

import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { Node } from '@xyflow/react';

/**
 * useLoopRegion — 监听 loop 类型 edge 的增减
 * 创建 loop edge 时自动生成包围源/目标节点的循环区域标记块
 * 删除 loop edge 时自动删除对应的循环区域
 */
export function useLoopRegion() {
  const edges = useWorkflowStore((s) => s.edges);
  const prevLoopEdgeIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loopEdges = edges.filter((e) => e.type === 'loop');
    const currentLoopIds = new Set(loopEdges.map((e) => e.id));
    const prevIds = prevLoopEdgeIds.current;

    // Detect newly added loop edges
    const addedEdges = loopEdges.filter((e) => !prevIds.has(e.id));
    // Detect removed loop edges
    const removedIds = [...prevIds].filter((id) => !currentLoopIds.has(id));

    if (addedEdges.length > 0 || removedIds.length > 0) {
      const store = useWorkflowStore.getState();
      let updatedNodes = [...store.nodes];

      // Add loop region for new loop edges
      for (const edge of addedEdges) {
        const regionId = `loop-region-${edge.id}`;
        // Check if region already exists
        if (updatedNodes.some((n) => n.id === regionId)) continue;

        const sourceNode = updatedNodes.find((n) => n.id === edge.source);
        const targetNode = updatedNodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          // Calculate bounding box around source and target
          const padding = 40;
          const nodeWidth = 352; // 22rem ≈ 352px
          const nodeHeight = 240; // approximate height

          const minX = Math.min(sourceNode.position.x, targetNode.position.x) - padding;
          const minY = Math.min(sourceNode.position.y, targetNode.position.y) - padding;
          const maxX = Math.max(sourceNode.position.x + nodeWidth, targetNode.position.x + nodeWidth) + padding;
          const maxY = Math.max(sourceNode.position.y + nodeHeight, targetNode.position.y + nodeHeight) + padding;

          const regionNode: Node = {
            id: regionId,
            type: 'loop_region',
            position: { x: minX, y: minY },
            data: {
              label: '循环区域',
              edgeId: edge.id,
            },
            style: {
              width: maxX - minX,
              height: maxY - minY,
            },
            draggable: true,
            selectable: true,
            // Place behind other nodes
            zIndex: -1,
          };

          updatedNodes = [regionNode, ...updatedNodes];
        }
      }

      // Remove loop region for deleted loop edges
      for (const removedId of removedIds) {
        const regionId = `loop-region-${removedId}`;
        updatedNodes = updatedNodes.filter((n) => n.id !== regionId);
      }

      // Only update if changes were made
      if (addedEdges.length > 0 || removedIds.length > 0) {
        store.setNodes(updatedNodes);
      }
    }

    prevLoopEdgeIds.current = currentLoopIds;
  }, [edges]);
}
