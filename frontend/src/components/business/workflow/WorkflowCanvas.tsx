'use client';

import { useCallback, useState } from 'react';
import {
  Controls,
  ReactFlow,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BottomDrawer from '@/components/business/workflow/BottomDrawer';
import AnimatedEdge from '@/components/business/workflow/edges/AnimatedEdge';
import AIStepNode from '@/components/business/workflow/nodes/AIStepNode';
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
  const { nodes, edges, onNodesChange, onEdgesChange } = useWorkflowStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<AIStepNodeData | null>(null);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSelectedNodeId(node.id);
      setSelectedNodeData((node.data as unknown as AIStepNodeData) ?? null);
      setDrawerOpen(true);
    }
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <div className="w-full h-full bg-background bg-grid-pattern-canvas workflow-canvas" style={{ touchAction: 'none' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => onNodesChange(changes)}
        onEdgesChange={(changes) => onEdgesChange(changes)}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'default', animated: false }}
        fitView
        panOnScroll={false}
        zoomOnPinch
        panOnDrag
        nodeDragThreshold={4}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} className="workflow-controls" position="bottom-right" />
      </ReactFlow>

      <BottomDrawer open={drawerOpen} onClose={handleDrawerClose} nodeId={selectedNodeId} nodeData={selectedNodeData} />
    </div>
  );
}
