import { useCallback } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import { createDefaultNodeData, createCommunityNodeData } from '@/features/workflow/components/canvas/canvas-node-factory';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { CommunityNodeInsertPayload } from '@/types';

/**
 * Drag-and-drop handler for adding nodes from the node store panel onto the canvas.
 */
export function useCanvasDnd(
  reactFlowInstance: ReactFlowInstance,
  setSelectedNodeId: (id: string | null) => void,
) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/studysolo-node-type');
      if (!nodeType) return;

      const flowPos = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const store = useWorkflowStore.getState();
      store.takeSnapshot();

      const isLoop = nodeType === 'loop_group';
      const nodeId = `${nodeType}-${Date.now().toString(36)}`;

      if (nodeType === 'community_node') {
        const communityId = e.dataTransfer.getData('application/studysolo-community-id');
        const metaStr = e.dataTransfer.getData('application/studysolo-community-meta');
        const communityNode = metaStr ? JSON.parse(metaStr) as CommunityNodeInsertPayload : null;
        const newNode: Node = {
          id: nodeId, type: 'community_node',
          position: { x: flowPos.x - 176, y: flowPos.y - 70 },
          data: createCommunityNodeData({
            ...(communityNode ?? { id: communityId, name: '社区节点', icon: 'Bot', input_hint: '', output_format: 'markdown', model_preference: 'auto', description: '' }),
            id: communityId || communityNode?.id || '',
          }),
        };
        store.setNodes([...store.nodes, newNode]);
        setSelectedNodeId(nodeId);
        return;
      }

      const newNode: Node = {
        id: nodeId, type: nodeType,
        position: { x: flowPos.x - (isLoop ? 250 : 176), y: flowPos.y - (isLoop ? 175 : 70) },
        data: createDefaultNodeData(nodeType),
        ...(isLoop ? { style: { width: 500, height: 350 } } : {}),
      };
      store.setNodes([...store.nodes, newNode]);
      setSelectedNodeId(nodeId);
    },
    [reactFlowInstance, setSelectedNodeId],
  );

  return { handleDragOver, handleDrop };
}
