'use client';

import { useCallback, useState } from 'react';
import {
  ConnectionLineType,
  Controls,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeMouseHandler,
  type EdgeTypes,
  type NodeMouseHandler,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';

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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setEdges } = useWorkflowStore();

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

  const wouldCreateCycle = useCallback(
    (connection: Connection, existingEdges: Edge[]) => {
      const { source, target } = connection;
      if (!source || !target) return false;

      const adjacency = new Map<string, string[]>();
      for (const edge of existingEdges) {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
        adjacency.get(edge.source)!.push(edge.target);
      }

      // If target can already reach source, adding source -> target creates a cycle.
      const visited = new Set<string>();
      const stack = [target];
      while (stack.length) {
        const node = stack.pop()!;
        if (node === source) return true;
        if (visited.has(node)) continue;
        visited.add(node);
        const next = adjacency.get(node) ?? [];
        for (const n of next) {
          if (!visited.has(n)) stack.push(n);
        }
      }
      return false;
    },
    []
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return;

      if (source === target) {
        toast.warning('不允许自环连线：节点不能连接到自己');
        return;
      }

      if (wouldCreateCycle(connection, edges)) {
        toast.warning('不允许形成环路：该连线会导致循环依赖');
        return;
      }

      onConnect(connection);
      toast.success('连线已创建');
    },
    [edges, onConnect, wouldCreateCycle]
  );

  const handleEdgeDoubleClick: EdgeMouseHandler = useCallback(
    (_event, edge) => {
      setEdges(edges.filter((e) => e.id !== edge.id));
      toast.success('连线已删除');
    },
    [edges, setEdges]
  );

  return (
    <div className="w-full h-full bg-background bg-grid-pattern-canvas workflow-canvas" style={{ touchAction: 'none' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => onNodesChange(changes)}
        onEdgesChange={(changes) => onEdgesChange(changes)}
        onConnect={handleConnect}
        onEdgeDoubleClick={handleEdgeDoubleClick}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{
          type: 'default',
          animated: false,
          style: {
            strokeWidth: 2.5,
            strokeOpacity: 0.82,
          },
        }}
        connectionLineType={ConnectionLineType.Bezier}
        connectionLineStyle={{
          stroke: '#7C83F6',
          strokeWidth: 2.2,
          strokeOpacity: 0.65,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }}
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
      <div className="pointer-events-none absolute left-4 bottom-4 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-300 backdrop-blur">
        提示：双击连线可删除；禁止自环与循环依赖
      </div>

      <BottomDrawer open={drawerOpen} onClose={handleDrawerClose} nodeId={selectedNodeId} nodeData={selectedNodeData} />
    </div>
  );
}
