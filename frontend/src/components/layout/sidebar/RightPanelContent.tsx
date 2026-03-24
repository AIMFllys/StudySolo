'use client';

import type { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import { usePanelStore } from '@/stores/use-panel-store';
import { CollapsibleSection } from '../CollapsibleSection';
import type { AIStepNodeData } from '@/types';
import {
  getNodeTheme,
  getNodePreview,
  getNodeTitle,
  getNodeTypeMeta,
  getStatusMeta,
  STATUS_META,
} from '@/features/workflow/constants/workflow-meta';

function getNodeData(node: Node | null | undefined) {
  return (node?.data as unknown as AIStepNodeData | undefined) ?? undefined;
}

function StatusItem({ count, status }: { count: number; status: keyof typeof STATUS_META }) {
  const meta = STATUS_META[status];
  return (
    <div className="node-paper-bg rounded-xl border-[1.5px] border-border/50 px-3 py-2 shadow-sm font-mono">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <span className={`inline-block h-2 w-2 rounded-sm ${meta.dotClassName}`} />
        {meta.label}
      </div>
      <p className="mt-1.5 text-lg font-bold text-foreground">{count}</p>
    </div>
  );
}

function getEdgeSummary(node: Node, edges: { source: string; target: string }[]) {
  return {
    incoming: edges.filter((edge) => edge.target === node.id).length,
    outgoing: edges.filter((edge) => edge.source === node.id).length,
  };
}

/**
 * RightPanelContent — the actual content of the execution/right panel.
 * This is extracted so it can be rendered in either the right panel or the left sidebar.
 */
export default function RightPanelContent() {
  const {
    edges,
    lastImplicitContext,
    lastPrompt,
    nodes,
    selectedNodeId,
    setSelectedNodeId,
  } = useWorkflowStore();

  const statusCounts = nodes.reduce<Record<string, number>>((acc, node) => {
    const status = getNodeData(node)?.status ?? 'pending';
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? nodes[0] ?? null;
  const selectedMeta = selectedNode
    ? getNodeTypeMeta((getNodeData(selectedNode)?.type ?? selectedNode.type) as string)
    : null;
  const selectedStatus = selectedNode
    ? getStatusMeta(getNodeData(selectedNode)?.status)
    : null;
  const selectedEdges = selectedNode ? getEdgeSummary(selectedNode, edges) : null;



  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Section 1: Status overview */}
        <CollapsibleSection id="right-status" title="工作流步骤总览">
          <p className="mb-3 text-sm text-muted-foreground">
            每个生成步骤都会在这里同步展示，便于看清当前逻辑链路和产出。
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatusItem status="pending" count={statusCounts.pending ?? 0} />
            <StatusItem status="running" count={statusCounts.running ?? 0} />
            <StatusItem status="done" count={statusCounts.done ?? 0} />
            <StatusItem status="error" count={statusCounts.error ?? 0} />
          </div>
        </CollapsibleSection>

        {/* Section 2: Selected node detail */}
        {selectedNode && selectedMeta && selectedStatus && selectedEdges ? (
          <CollapsibleSection
            id="right-focus"
            title="当前焦点"
            badge={
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide shadow-sm ${selectedStatus.badgeClassName}`}>
                {selectedStatus.label}
              </span>
            }
          >
            <div>
              <h4 className="text-sm font-semibold text-foreground">{getNodeTitle(selectedNode)}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMeta.description}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground font-mono">
              <div className="node-paper-bg rounded-xl border-[1.5px] border-border/50 px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] uppercase font-medium">进入连接</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{selectedEdges.incoming}</p>
              </div>
              <div className="node-paper-bg rounded-xl border-[1.5px] border-border/50 px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] uppercase font-medium">输出连接</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{selectedEdges.outgoing}</p>
              </div>
            </div>

            <div className="node-paper-bg mt-3 rounded-xl border-[1.5px] border-border/50 px-3 py-3 shadow-sm">
              <p className="font-mono text-[10px] uppercase tracking-wider font-medium text-muted-foreground">输出预览</p>
              <p className="mt-2 text-sm leading-6 text-foreground font-serif">
                {getNodePreview(getNodeData(selectedNode)?.output, '该步骤还没有生成可展示内容')}
              </p>
            </div>
          </CollapsibleSection>
        ) : (
          <CollapsibleSection id="right-focus" title="当前焦点">
            <p className="text-sm text-muted-foreground">
              还没有生成任何工作流步骤。输入学习目标后，右侧会按步骤展示整个生成链路。
            </p>
          </CollapsibleSection>
        )}

        {/* Section 3: Last prompt */}
        {lastPrompt ? (
          <CollapsibleSection id="right-prompt" title="最近一次生成目标">
            <p className="text-sm leading-6 text-foreground">{lastPrompt}</p>
            {typeof lastImplicitContext?.global_theme === 'string' ? (
              <p className="mt-2 text-xs text-muted-foreground">主题线索：{lastImplicitContext.global_theme}</p>
            ) : null}
          </CollapsibleSection>
        ) : null}

        {/* Section 4: Node list */}
        <CollapsibleSection
          id="right-nodes"
          title="生成步骤"
          badge={<span className="text-xs text-muted-foreground">{nodes.length} 个节点</span>}
        >
          <div className="space-y-3">
            {nodes.map((node, index) => {
              const nodeData = getNodeData(node);
              const meta = getNodeTypeMeta(nodeData?.type ?? node.type);
              const status = getStatusMeta(nodeData?.status);
              const nodeTheme = getNodeTheme(nodeData?.type ?? node.type ?? 'chat_response');
              const isSelected = node.id === selectedNode?.id;
              const edgeSummary = getEdgeSummary(node, edges);

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`group w-full rounded-xl px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'bg-background border-[1.5px] border-border shadow-md'
                      : 'node-paper-bg border-[1.5px] border-border/50 hover:shadow-md hover:-translate-y-0.5 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm transition-transform group-hover:scale-105 border-[1.5px] ${nodeTheme.borderClass} ${nodeTheme.headerTextColor}`}>
                        <meta.icon className="z-10 h-4 w-4 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Step {index + 1}</p>
                        <p className="truncate text-sm font-medium text-foreground">{getNodeTitle(node)}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider shadow-sm ${status.badgeClassName}`}>
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground font-mono">{meta.description}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/90 font-serif">
                    {getNodePreview(nodeData?.output)}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                    <span>输入 {edgeSummary.incoming}</span>
                    <span>输出 {edgeSummary.outgoing}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
