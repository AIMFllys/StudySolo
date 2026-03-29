import { useEffect, useRef } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import type { CanvasTool } from '@/features/workflow/components/toolbar/FloatingToolbar';
import type { NodeConfigAnchorRect } from '@/features/workflow/components/node-config/popover-position';
import { createDefaultNodeData, createCommunityNodeData } from '@/features/workflow/components/canvas/canvas-node-factory';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { CommunityNodeInsertPayload } from '@/types';

interface UseCanvasEventListenersOptions {
  reactFlowInstance: ReactFlowInstance;
  nodes: Node[];
  setCanvasTool: (tool: CanvasTool) => void;
  setModal: (modal: { title: string; message: string } | null) => void;
  setPlacementMode: (mode: string | null) => void;
  setConfigNodeId: (id: string | null) => void;
  setConfigAnchorRect: (rect: NodeConfigAnchorRect | null) => void;
  setNodes: (nodes: Node[]) => void;
  setSelectedNodeId: (id: string | null) => void;
}

/**
 * All CustomEvent listeners for the workflow canvas, consolidated into one hook.
 */
export function useCanvasEventListeners({
  reactFlowInstance,
  nodes,
  setCanvasTool,
  setModal,
  setPlacementMode,
  setConfigNodeId,
  setConfigAnchorRect,
  setNodes,
  setSelectedNodeId,
}: UseCanvasEventListenersOptions) {
  const annotationCountRef = useRef(0);

  // canvas:tool-change
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tool: CanvasTool };
      setCanvasTool(detail.tool);
    };
    window.addEventListener('canvas:tool-change', handler);
    return () => window.removeEventListener('canvas:tool-change', handler);
  }, [setCanvasTool]);

  // canvas:show-modal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { title: string; message: string };
      setModal(detail);
    };
    window.addEventListener('canvas:show-modal', handler);
    return () => window.removeEventListener('canvas:show-modal', handler);
  }, [setModal]);

  // canvas:focus-node (from search)
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail as { nodeId: string };
      const node = nodes.find((n) => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(
          node.position.x + 160,
          node.position.y + 60,
          { zoom: 1.2, duration: 400 },
        );
      }
    };
    window.addEventListener('canvas:focus-node', handler);
    return () => window.removeEventListener('canvas:focus-node', handler);
  }, [nodes, reactFlowInstance]);

  // canvas:add-annotation
  useEffect(() => {
    const handler = (e: Event) => {
      const { emoji } = (e as CustomEvent).detail as { emoji: string };
      annotationCountRef.current += 1;
      const canvasCenter = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const newNode = {
        id: `annotation-${Date.now()}-${annotationCountRef.current}`,
        type: 'annotation',
        position: { x: canvasCenter.x, y: canvasCenter.y - 100 },
        data: { emoji, label: emoji },
        draggable: true,
        selectable: true,
      };
      const currentNodes = useWorkflowStore.getState().nodes;
      setNodes([...currentNodes, newNode]);
    };
    window.addEventListener('canvas:add-annotation', handler);
    return () => window.removeEventListener('canvas:add-annotation', handler);
  }, [reactFlowInstance, setNodes]);

  // canvas:delete-annotation
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail as { nodeId: string };
      const currentNodes = useWorkflowStore.getState().nodes;
      setNodes(currentNodes.filter((n) => n.id !== nodeId));
    };
    window.addEventListener('canvas:delete-annotation', handler);
    return () => window.removeEventListener('canvas:delete-annotation', handler);
  }, [setNodes]);

  // canvas:placement-mode
  useEffect(() => {
    const handler = (e: Event) => {
      const { mode } = (e as CustomEvent).detail as { mode: string };
      setPlacementMode(mode === 'connect' ? null : mode);
    };
    window.addEventListener('canvas:placement-mode', handler);
    return () => window.removeEventListener('canvas:placement-mode', handler);
  }, [setPlacementMode]);

  // node-store:add-node
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeType, communityNode } = (e as CustomEvent).detail as {
        nodeType: string;
        communityNode?: CommunityNodeInsertPayload;
      };
      if (!nodeType) return;

      const store = useWorkflowStore.getState();
      store.takeSnapshot();

      const isLoop = nodeType === 'loop_group';
      const nodeId = `${nodeType}-${Date.now().toString(36)}`;
      const canvasCenter = reactFlowInstance.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node =
        nodeType === 'community_node'
          ? {
              id: nodeId,
              type: 'community_node',
              position: { x: canvasCenter.x - 176, y: canvasCenter.y - 70 },
              data: createCommunityNodeData(communityNode),
            }
          : {
              id: nodeId,
              type: nodeType,
              position: {
                x: canvasCenter.x - (isLoop ? 250 : 176),
                y: canvasCenter.y - (isLoop ? 175 : 70),
              },
              data: createDefaultNodeData(nodeType),
              ...(isLoop ? { style: { width: 500, height: 350 } } : {}),
            };

      store.setNodes([...store.nodes, newNode]);
      setSelectedNodeId(nodeId);
    };
    window.addEventListener('node-store:add-node', handler);
    return () => window.removeEventListener('node-store:add-node', handler);
  }, [reactFlowInstance, setSelectedNodeId]);

  // workflow:open-node-config
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        nodeId?: string;
        anchorRect?: NodeConfigAnchorRect | null;
      };
      if (detail?.nodeId) {
        setConfigNodeId(detail.nodeId);
        setConfigAnchorRect(detail.anchorRect ?? null);
      }
    };
    window.addEventListener('workflow:open-node-config', handler);
    return () => window.removeEventListener('workflow:open-node-config', handler);
  }, [setConfigNodeId, setConfigAnchorRect]);

  // workflow:close-node-config
  useEffect(() => {
    const handler = () => {
      setConfigNodeId(null);
      setConfigAnchorRect(null);
    };
    window.addEventListener('workflow:close-node-config', handler);
    return () => window.removeEventListener('workflow:close-node-config', handler);
  }, [setConfigNodeId, setConfigAnchorRect]);

  // fullscreen change
  useEffect(() => {
    const handleFsChange = () => {
      // This is consumed by the parent via isFullscreen state
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);
}
