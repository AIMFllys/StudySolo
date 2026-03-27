'use client';

import { useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  type NodeTypes,
  type EdgeTypes,
  MarkerType,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import AIStepNode from '@/features/workflow/components/nodes/AIStepNode';
import GeneratingNode from '@/features/workflow/components/nodes/GeneratingNode';
import AnnotationNode from '@/features/workflow/components/nodes/AnnotationNode';
import LoopGroupNode from '@/features/workflow/components/nodes/LoopGroupNode';
import AnimatedEdge from '@/features/workflow/components/canvas/edges/AnimatedEdge';
import SequentialEdge from '@/features/workflow/components/canvas/edges/SequentialEdge';

/**
 * Shared node type registry — mirrors WorkflowCanvas.tsx.
 * All 20 node types render through AIStepNode (read-only by ReactFlow props).
 */
const readOnlyNodeTypes: NodeTypes = {
  trigger_input: AIStepNode,
  ai_analyzer: AIStepNode,
  ai_planner: AIStepNode,
  outline_gen: AIStepNode,
  content_extract: AIStepNode,
  summary: AIStepNode,
  flashcard: AIStepNode,
  chat_response: AIStepNode,
  write_db: AIStepNode,
  compare: AIStepNode,
  mind_map: AIStepNode,
  quiz_gen: AIStepNode,
  merge_polish: AIStepNode,
  knowledge_base: AIStepNode,
  web_search: AIStepNode,
  export_file: AIStepNode,
  logic_switch: AIStepNode,
  loop_map: AIStepNode,
  community_node: AIStepNode,
  generating: GeneratingNode,
  annotation: AnnotationNode,
  loop_group: LoopGroupNode,
};

const readOnlyEdgeTypes: EdgeTypes = {
  default: AnimatedEdge,
  sequential: SequentialEdge,
};

interface ReadOnlyCanvasProps {
  nodes: Node[];
  edges: Edge[];
  className?: string;
}

function ReadOnlyCanvasInner({ nodes, edges, className }: ReadOnlyCanvasProps) {
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

  const fitViewOptions = useMemo(() => ({ padding: 0.2 }), []);
  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className={`bg-background bg-grid-pattern-canvas ${className ?? ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={readOnlyNodeTypes}
        edgeTypes={readOnlyEdgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        /* ── All editing disabled ── */
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        /* ── Navigation enabled ── */
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        panOnScroll={false}
        minZoom={0.1}
        maxZoom={2.5}
        fitView
        fitViewOptions={fitViewOptions}
        proOptions={proOptions}
      >
        <Controls
          showInteractive={false}
          className="workflow-controls"
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
}

/**
 * ReadOnlyCanvas — renders a workflow graph in view-only mode.
 *
 * Features:
 *   ✅ All node types rendered (with outputs visible)
 *   ✅ Zoom (scroll + pinch) and pan (drag)
 *   ❌ No node dragging, connecting, selecting, or editing
 *   ❌ No context menus, toolbar, or bottom drawer
 *
 * Usage:
 *   <ReadOnlyCanvas nodes={wf.nodes_json} edges={wf.edges_json} className="min-h-[500px]" />
 */
export default function ReadOnlyCanvas(props: ReadOnlyCanvasProps) {
  return (
    <ReactFlowProvider>
      <ReadOnlyCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
