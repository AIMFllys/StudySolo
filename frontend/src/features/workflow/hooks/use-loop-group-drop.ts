'use client';

import { useCallback } from 'react';
import type { Node, OnNodeDrag } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

/**
 * useLoopGroupDrop — 处理节点拖入/拖出循环块容器的逻辑
 *
 * 当节点拖动结束时:
 * - 检测是否落入某个 loop_group 容器的范围内
 * - 如果是 → 设置 parentId + extent:'parent' + 调整为相对坐标
 * - 如果不是但原来有 parentId → 清除 parentId + 恢复为绝对坐标
 */
export function useLoopGroupDrop(): OnNodeDrag {
  return useCallback((_event: React.MouseEvent, draggedNode: Node, _nodes: Node[]) => {
    const store = useWorkflowStore.getState();
    const { nodes } = store;

    // loop_group 节点不能拖入自身
    if (draggedNode.type === 'loop_group') return;

    const draggedId = draggedNode.id;
    const currentParentId = draggedNode.parentId;
    const dragPos = draggedNode.position;

    // 计算拖动节点的绝对位置（如果在容器内则 position 是相对的）
    let absX = dragPos.x;
    let absY = dragPos.y;
    if (currentParentId) {
      const parent = nodes.find((n) => n.id === currentParentId);
      if (parent) {
        absX += parent.position.x;
        absY += parent.position.y;
      }
    }

    // 找到所有 loop_group 容器
    const groupNodes = nodes.filter(
      (n) => n.type === 'loop_group' && n.id !== draggedId
    );

    // 检测节点中心是否落入某个 loop_group 的区域
    const nodeWidth = 352; // AIStepNode 默认宽度 22rem ≈ 352px
    const nodeHeight = 224; // 近似高度
    const centerX = absX + nodeWidth / 2;
    const centerY = absY + nodeHeight / 2;

    let newParentId: string | undefined;
    for (const group of groupNodes) {
      const gx = group.position.x;
      const gy = group.position.y;
      const gw = (group.style?.width as number) || 500;
      const gh = (group.style?.height as number) || 350;

      // 检测中心点是否在容器区域内（留一点 padding）
      if (
        centerX > gx + 10 &&
        centerX < gx + gw - 10 &&
        centerY > gy + 40 && // 40px 留给 header
        centerY < gy + gh - 10
      ) {
        newParentId = group.id;
        break;
      }
    }

    // 状态未变化，直接返回
    if (newParentId === currentParentId) return;

    store.takeSnapshot();

    const updatedNodes = nodes.map((n) => {
      if (n.id !== draggedId) return n;

      if (newParentId) {
        // 拖入容器：转为相对坐标
        const parent = nodes.find((p) => p.id === newParentId);
        if (!parent) return n;
        return {
          ...n,
          parentId: newParentId,
          extent: 'parent' as const,
          position: {
            x: absX - parent.position.x,
            y: absY - parent.position.y,
          },
        };
      }

      // 拖出容器：恢复为绝对坐标
      return {
        ...n,
        parentId: undefined,
        extent: undefined,
        position: { x: absX, y: absY },
      };
    });

    store.setNodes(updatedNodes);
  }, []);
}
