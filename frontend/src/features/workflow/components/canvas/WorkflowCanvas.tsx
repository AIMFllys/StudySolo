'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  Controls,
  MiniMap,
  type ConnectionLineType,
  MarkerType,
  ReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
  useReactFlow,
  SelectionMode,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BottomDrawer from '@/features/workflow/components/panel/BottomDrawer';
import FloatingToolbar from '@/features/workflow/components/toolbar/FloatingToolbar';
import type { CanvasTool } from '@/features/workflow/components/toolbar/FloatingToolbar';
import AnimatedEdge from '@/features/workflow/components/canvas/edges/AnimatedEdge';
import AIStepNode from '@/features/workflow/components/nodes/AIStepNode';
import GeneratingNode from '@/features/workflow/components/nodes/GeneratingNode';
import AnnotationNode from '@/features/workflow/components/nodes/AnnotationNode';
import CanvasModal from '@/features/workflow/components/canvas/CanvasModal';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { AIStepNodeData } from '@/types';

const nodeTypes: NodeTypes = {
  // ── 原始节点 (9) ──
  trigger_input: AIStepNode,
  ai_analyzer: AIStepNode,
  ai_planner: AIStepNode,
  outline_gen: AIStepNode,
  content_extract: AIStepNode,
  summary: AIStepNode,
  flashcard: AIStepNode,
  chat_response: AIStepNode,
  write_db: AIStepNode,
  // ── P1 节点 (7) ──
  compare: AIStepNode,
  mind_map: AIStepNode,
  quiz_gen: AIStepNode,
  merge_polish: AIStepNode,
  knowledge_base: AIStepNode,
  web_search: AIStepNode,
  export_file: AIStepNode,
  // ── P2 引擎节点 (2) ──
  logic_switch: AIStepNode,
  loop_map: AIStepNode,
  // ── 状态节点 (1) ──
  generating: GeneratingNode,
  // ── 标注节点 ──
  annotation: AnnotationNode,
};

const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
};

function WorkflowCanvasInner() {
  const {
    edges,
    nodes,
    onConnect,
    onEdgesChange,
    onNodesChange,
    selectedNodeId,
    setSelectedNodeId,
    setNodes,
  } = useWorkflowStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [canvasTool, setCanvasTool] = useState<CanvasTool>('pan');
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null);
  const reactFlowInstance = useReactFlow();
  const annotationCountRef = useRef(0);

  const selectedNodeData = useMemo(
    () =>
      ((selectedNodeId
        ? nodes.find((node) => node.id === selectedNodeId)?.data
        : null) as unknown as AIStepNodeData | null) ?? null,
    [nodes, selectedNodeId]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'default',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: 'var(--edge-marker-color, #78716c)',
      },
    }),
    []
  );

  const fitViewOptions = useMemo(() => ({ padding: 0.18 }), []);
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setDrawerOpen(true);
      }
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: { id: string }[] }) => {
      const nextId = selectedNodes[0]?.id ?? null;
      setSelectedNodeId(nextId);
    },
    [setSelectedNodeId]
  );

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // ── Listen for tool change events ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { tool: CanvasTool };
      setCanvasTool(detail.tool);
    };
    window.addEventListener('canvas:tool-change', handler);
    return () => window.removeEventListener('canvas:tool-change', handler);
  }, []);

  // ── Listen for modal events ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { title: string; message: string };
      setModal(detail);
    };
    window.addEventListener('canvas:show-modal', handler);
    return () => window.removeEventListener('canvas:show-modal', handler);
  }, []);

  // ── Listen for focus-node events (from search) ────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail as { nodeId: string };
      const node = nodes.find((n) => n.id === nodeId);
      if (node && reactFlowInstance) {
        reactFlowInstance.setCenter(
          node.position.x + 160,
          node.position.y + 60,
          { zoom: 1.2, duration: 400 }
        );
      }
    };
    window.addEventListener('canvas:focus-node', handler);
    return () => window.removeEventListener('canvas:focus-node', handler);
  }, [nodes, reactFlowInstance]);

  // ── Listen for annotation add events ───────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { emoji } = (e as CustomEvent).detail as { emoji: string };
      annotationCountRef.current += 1;

      // Place annotation at viewport center
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

  // ── Listen for annotation delete events ────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { nodeId } = (e as CustomEvent).detail as { nodeId: string };
      const currentNodes = useWorkflowStore.getState().nodes;
      setNodes(currentNodes.filter((n) => n.id !== nodeId));
    };
    window.addEventListener('canvas:delete-annotation', handler);
    return () => window.removeEventListener('canvas:delete-annotation', handler);
  }, [setNodes]);

  // ── Compute React Flow props based on active tool ──────────────────────────
  const isSelectMode = canvasTool === 'select';

  return (
    <div
      className={`workflow-canvas relative h-full w-full bg-background bg-grid-pattern-canvas ${
        isSelectMode ? 'cursor-crosshair' : ''
      }`}
      style={{ touchAction: 'none' }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={'smoothstep' as ConnectionLineType}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={fitViewOptions}
        // Interaction mode:
        //   select: panOnDrag=false, selectionOnDrag=true, nodesDraggable=true
        //   pan:    panOnDrag=true, selectionOnDrag=false, nodesDraggable=true
        panOnScroll={false}
        zoomOnPinch
        panOnDrag={!isSelectMode}
        nodesDraggable
        selectionOnDrag={isSelectMode}
        selectionMode={isSelectMode ? SelectionMode.Partial : SelectionMode.Full}
        nodeDragThreshold={4}
        minZoom={0.2}
        maxZoom={2}
        proOptions={proOptions}
      >
        <MiniMap
          pannable
          zoomable
          position="bottom-left"
          nodeBorderRadius={18}
          nodeStrokeWidth={selectedNodeId ? 2 : 1}
          nodeColor={(node) => (node.id === selectedNodeId ? '#818cf8' : '#1e293b')}
          maskColor="rgba(2, 6, 23, 0.45)"
        />
        <Controls showInteractive={false} className="workflow-controls" position="bottom-right" />
      </ReactFlow>

      <FloatingToolbar />

      <BottomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        nodeId={selectedNodeId}
        nodeData={selectedNodeData}
      />

      {/* Canvas modal for edit/upload messages */}
      {modal && (
        <CanvasModal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

/**
 * WorkflowCanvas with ReactFlowProvider wrapper.
 * Required so useReactFlow() hook works inside.
 */
export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
