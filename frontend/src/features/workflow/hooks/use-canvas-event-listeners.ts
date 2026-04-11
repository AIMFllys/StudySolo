import { useEffect, useRef } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import type { CanvasTool } from '@/features/workflow/components/toolbar/FloatingToolbar';
import type { NodeConfigAnchorRect } from '@/features/workflow/components/node-config/popover-position';
import { createDefaultNodeData, createCommunityNodeData } from '@/features/workflow/components/canvas/canvas-node-factory';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import type { CommunityNodeInsertPayload } from '@/types';
import { eventBus } from '@/lib/events/event-bus';

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
    return eventBus.on('canvas:tool-change', (detail) => {
      setCanvasTool(detail.tool as CanvasTool);
    });
  }, [setCanvasTool]);

  // canvas:show-modal
  useEffect(() => {
    return eventBus.on('canvas:show-modal', (detail) => {
      setModal(detail);
    });
  }, [setModal]);

  // canvas:focus-node (from search)
  useEffect(() => {
    return eventBus.on('canvas:focus-node', ({ nodeId }) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(
          node.position.x + 160,
          node.position.y + 60,
          { zoom: 1.2, duration: 400 },
        );
      }
    });
  }, [nodes, reactFlowInstance]);

  // canvas:add-annotation
  useEffect(() => {
    return eventBus.on('canvas:add-annotation', ({ emoji }) => {
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
    });
  }, [reactFlowInstance, setNodes]);

  // canvas:delete-annotation
  useEffect(() => {
    return eventBus.on('canvas:delete-annotation', ({ nodeId }) => {
      const currentNodes = useWorkflowStore.getState().nodes;
      setNodes(currentNodes.filter((n) => n.id !== nodeId));
    });
  }, [setNodes]);

  // canvas:placement-mode
  useEffect(() => {
    return eventBus.on('canvas:placement-mode', ({ mode }) => {
      setPlacementMode(mode === 'connect' ? null : mode);
    });
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
    return eventBus.on('workflow:open-node-config', (detail) => {
      if (detail?.nodeId) {
        setConfigNodeId(detail.nodeId);
        setConfigAnchorRect((detail.anchorRect as NodeConfigAnchorRect | null | undefined) ?? null);
      }
    });
  }, [setConfigNodeId, setConfigAnchorRect]);

  // workflow:close-node-config
  useEffect(() => {
    return eventBus.on('workflow:close-node-config', () => {
      setConfigNodeId(null);
      setConfigAnchorRect(null);
    });
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
