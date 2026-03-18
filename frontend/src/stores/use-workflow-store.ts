import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { Connection, Edge, EdgeChange, Node, NodeChange } from '@xyflow/react';
import type { AIStepNodeData, EdgeType } from '@/types';

type NodeData = AIStepNodeData;

/** Click-to-connect 状态 */
export interface ClickConnectState {
  /** idle: 未激活 | waiting-target: 已选源，等待点击目标 */
  phase: 'idle' | 'waiting-target';
  sourceNodeId?: string;
  sourceHandleId?: string;
}

interface WorkflowStore {
  nodes: Node[];
  edges: Edge[];
  currentWorkflowId: string | null;
  selectedNodeId: string | null;
  lastPrompt: string;
  lastImplicitContext: Record<string, unknown> | null;
  isDirty: boolean;
  activeEdgeType: EdgeType;
  clickConnectState: ClickConnectState;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeData: (
    nodeId: string,
    data: Partial<NodeData> | ((prev: NodeData) => Partial<NodeData>)
  ) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  replaceWorkflowGraph: (nodes: Node[], edges: Edge[]) => void;
  setActiveEdgeType: (edgeType: EdgeType) => void;
  startClickConnect: (sourceNodeId: string, sourceHandleId: string) => void;
  completeClickConnect: (targetNodeId: string, targetHandleId: string) => void;
  cancelClickConnect: () => void;
  setGenerationContext: (prompt: string, implicitContext: Record<string, unknown> | null) => void;
  setCurrentWorkflow: (id: string, nodes: Node[], edges: Edge[], dirty?: boolean) => void;
  markClean: () => void;
  
  // History Actions
  past: { nodes: Node[], edges: Edge[] }[];
  future: { nodes: Node[], edges: Edge[] }[];
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

function resolveSelectedNodeId(nodes: Node[], selectedNodeId: string | null) {
  if (!nodes.length) {
    return null;
  }

  if (selectedNodeId && nodes.some((node) => node.id === selectedNodeId)) {
    return selectedNodeId;
  }

  return nodes[0]?.id ?? null;
}

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  nodes: [],
  edges: [],
  past: [],
  future: [],
  currentWorkflowId: null,
  selectedNodeId: null,
  lastPrompt: '',
  lastImplicitContext: null,
  isDirty: false,
  activeEdgeType: 'sequential' as EdgeType,
  clickConnectState: { phase: 'idle' } as ClickConnectState,

  takeSnapshot: () =>
    set((state) => {
      const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
      if (newPast.length > 50) newPast.shift();
      return { past: newPast, future: [] };
    }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return state;
      const prev = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return {
        past: newPast,
        future: [{ nodes: state.nodes, edges: state.edges }, ...state.future],
        nodes: prev.nodes,
        edges: prev.edges,
        selectedNodeId: resolveSelectedNodeId(prev.nodes, state.selectedNodeId),
        isDirty: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, { nodes: state.nodes, edges: state.edges }],
        future: newFuture,
        nodes: next.nodes,
        edges: next.edges,
        selectedNodeId: resolveSelectedNodeId(next.nodes, state.selectedNodeId),
        isDirty: true,
      };
    }),

  setNodes: (nodes) =>
    set((state) => ({
      nodes,
      selectedNodeId: resolveSelectedNodeId(nodes, state.selectedNodeId),
      isDirty: true,
    })),

  setEdges: (edges) => set({ edges, isDirty: true }),

  onNodesChange: (changes) =>
    set((state) => {
      const isSignificant = changes.some((c) => c.type === 'remove');
      let newPast = state.past;
      if (isSignificant) {
        newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
        if (newPast.length > 50) newPast.shift();
      }
      
      const nextNodes = applyNodeChanges(changes, state.nodes);
      return {
        past: newPast,
        future: isSignificant ? [] : state.future,
        nodes: nextNodes,
        selectedNodeId: resolveSelectedNodeId(nextNodes, state.selectedNodeId),
        isDirty: true,
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const isSignificant = changes.some((c) => c.type === 'remove');
      let newPast = state.past;
      if (isSignificant) {
        newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
        if (newPast.length > 50) newPast.shift();
      }

      return {
        past: newPast,
        future: isSignificant ? [] : state.future,
        edges: applyEdgeChanges(changes, state.edges),
        isDirty: true,
      };
    }),

  onConnect: (connection) =>
    set((state) => {
      const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
      if (newPast.length > 50) newPast.shift();

      const edgeType = state.activeEdgeType;
      const edgeId = `edge-${edgeType}-${connection.source ?? 'u'}-${connection.target ?? 'u'}-${Date.now().toString(36)}`;
      
      return {
        past: newPast,
        future: [],
        edges: addEdge(
        {
          ...connection,
          id: edgeId,
          type: edgeType,
          animated: false,
          data: edgeType === 'conditional' ? { label: '条件' } : {},
        },
        state.edges
      ),
      isDirty: true,
      };
    }),

  setActiveEdgeType: (edgeType) => set({ activeEdgeType: edgeType }),

  startClickConnect: (sourceNodeId, sourceHandleId) =>
    set({ clickConnectState: { phase: 'waiting-target', sourceNodeId, sourceHandleId } }),

  completeClickConnect: (targetNodeId, targetHandleId) =>
    set((state) => {
      const { clickConnectState, activeEdgeType } = state;
      if (clickConnectState.phase !== 'waiting-target' || !clickConnectState.sourceNodeId) {
        return { clickConnectState: { phase: 'idle' } };
      }
      // Prevent self-connection
      if (clickConnectState.sourceNodeId === targetNodeId) {
        return { clickConnectState: { phase: 'idle' } };
      }

      const newPast = [...state.past, { nodes: state.nodes, edges: state.edges }];
      if (newPast.length > 50) newPast.shift();

      const edgeId = `edge-${activeEdgeType}-${clickConnectState.sourceNodeId}-${targetNodeId}-${Date.now().toString(36)}`;
      return {
        past: newPast,
        future: [],
        edges: addEdge(
          {
            id: edgeId,
            source: clickConnectState.sourceNodeId,
            target: targetNodeId,
            sourceHandle: clickConnectState.sourceHandleId,
            targetHandle: targetHandleId,
            type: activeEdgeType,
            animated: false,
            data: activeEdgeType === 'conditional' ? { label: '条件' } : {},
          },
          state.edges
        ),
        isDirty: true,
        clickConnectState: { phase: 'idle' },
      };
    }),

  cancelClickConnect: () => set({ clickConnectState: { phase: 'idle' } }),

  updateNodeData: (nodeId, data) =>
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const prevData = node.data as unknown as NodeData;
        const patch = typeof data === 'function' ? data(prevData) : data;
        return { ...node, data: { ...prevData, ...patch } };
      }),
      isDirty: true,
    })),

  setSelectedNodeId: (selectedNodeId) =>
    set((state) => (state.selectedNodeId === selectedNodeId ? state : { selectedNodeId })),

  replaceWorkflowGraph: (nodes, edges) =>
    set((state) => ({
      nodes,
      edges,
      selectedNodeId: resolveSelectedNodeId(nodes, state.selectedNodeId),
      isDirty: true,
    })),

  setGenerationContext: (lastPrompt, lastImplicitContext) =>
    set({
      lastPrompt,
      lastImplicitContext,
    }),

  setCurrentWorkflow: (id, nodes, edges, dirty = false) =>
    set({
      currentWorkflowId: id,
      nodes,
      edges: edges.map((e) => ({
        ...e,
        type: (e as { type?: string }).type || 'sequential',
        sourceHandle: (e as { sourceHandle?: string }).sourceHandle || 'source-right',
        targetHandle: (e as { targetHandle?: string }).targetHandle || 'target-left',
        data: (e as { data?: Record<string, unknown> }).data || {},
      })),
      selectedNodeId: resolveSelectedNodeId(nodes, null),
      isDirty: dirty,
    }),

  markClean: () => set({ isDirty: false }),
}));
