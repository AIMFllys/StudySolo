'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  type ConnectionLineType,
  MarkerType,
  ReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BottomDrawer from '@/features/workflow/components/panel/BottomDrawer';
import AnimatedEdge from '@/features/workflow/components/canvas/edges/AnimatedEdge';
import AIStepNode from '@/features/workflow/components/nodes/AIStepNode';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { AIStepNodeData } from '@/types';

const nodeTypes: NodeTypes = {
  ai_analyzer: AIStepNode,
  ai_planner: AIStepNode,
  outline_gen: AIStepNode,
  content_extract: AIStepNode,
  summary: AIStepNode,
  flashcard: AIStepNode,
  chat_response: AIStepNode,
  write_db: AIStepNode,
  trigger_input: AIStepNode,
};

const edgeTypes: EdgeTypes = {
  default: AnimatedEdge,
};

export default function WorkflowCanvas() {
  const {
    edges,
    nodes,
    onConnect,
    onEdgesChange,
    onNodesChange,
    selectedNodeId,
    setSelectedNodeId,
  } = useWorkflowStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canvasNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [nodes, selectedNodeId]
  );

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
        width: 18,
        height: 18,
        color: '#818cf8',
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

  return (
    <div className="workflow-canvas h-full w-full bg-background bg-grid-pattern-canvas" style={{ touchAction: 'none' }}>
      <ReactFlow
        nodes={canvasNodes}
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
        panOnScroll={false}
        zoomOnPinch
        panOnDrag
        nodeDragThreshold={4}
        minZoom={0.2}
        maxZoom={2}
        proOptions={proOptions}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.25} color="rgba(148, 163, 184, 0.18)" />
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

      <BottomDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        nodeId={selectedNodeId}
        nodeData={selectedNodeData}
      />
    </div>
  );
}
