'use client';

import Link from 'next/link';
import type { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { AIStepNodeData } from '@/types';
import {
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
    <div className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${meta.dotClassName}`} />
        {meta.label}
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground">{count}</p>
    </div>
  );
}

function getEdgeSummary(node: Node, edges: { source: string; target: string }[]) {
  return {
    incoming: edges.filter((edge) => edge.target === node.id).length,
    outgoing: edges.filter((edge) => edge.source === node.id).length,
  };
}

export default function RightPanel() {
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
    <aside className="hidden w-80 shrink-0 flex-col border-l border-border bg-background/95 p-4 backdrop-blur md:flex">
      <section className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">执行面板</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">工作流步骤总览</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            每个生成步骤都会在这里同步展示，便于看清当前逻辑链路和产出。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatusItem status="pending" count={statusCounts.pending ?? 0} />
          <StatusItem status="running" count={statusCounts.running ?? 0} />
          <StatusItem status="done" count={statusCounts.done ?? 0} />
          <StatusItem status="error" count={statusCounts.error ?? 0} />
        </div>
      </section>

      {selectedNode && selectedMeta && selectedStatus && selectedEdges ? (
        <section className="mt-5 rounded-3xl border border-white/8 bg-black/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">当前焦点</p>
              <h4 className="mt-1 text-sm font-semibold text-foreground">{getNodeTitle(selectedNode)}</h4>
              <p className="mt-1 text-xs text-muted-foreground">{selectedMeta.description}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${selectedStatus.badgeClassName}`}>
              {selectedStatus.label}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="rounded-2xl border border-white/8 bg-background/40 px-3 py-2">
              <p>进入连接</p>
              <p className="mt-1 text-base font-semibold text-foreground">{selectedEdges.incoming}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-background/40 px-3 py-2">
              <p>输出连接</p>
              <p className="mt-1 text-base font-semibold text-foreground">{selectedEdges.outgoing}</p>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-white/8 bg-background/40 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">输出预览</p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {getNodePreview(getNodeData(selectedNode)?.output, '该步骤还没有生成可展示内容')}
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-5 rounded-3xl border border-dashed border-white/10 bg-black/5 p-4 text-sm text-muted-foreground">
          还没有生成任何工作流步骤。输入学习目标后，右侧会按步骤展示整个生成链路。
        </section>
      )}

      {lastPrompt ? (
        <section className="mt-5 rounded-3xl border border-white/8 bg-black/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">最近一次生成目标</p>
          <p className="mt-2 text-sm leading-6 text-foreground">{lastPrompt}</p>
          {typeof lastImplicitContext?.global_theme === 'string' ? (
            <p className="mt-2 text-xs text-muted-foreground">主题线索：{lastImplicitContext.global_theme}</p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-5 flex min-h-0 flex-1 flex-col">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">生成步骤</h3>
          <span className="text-xs text-muted-foreground">{nodes.length} 个节点</span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {nodes.map((node, index) => {
            const nodeData = getNodeData(node);
            const meta = getNodeTypeMeta(nodeData?.type ?? node.type);
            const status = getStatusMeta(nodeData?.status);
            const isSelected = node.id === selectedNode?.id;
            const edgeSummary = getEdgeSummary(node, edges);

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`w-full rounded-3xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? 'border-primary/40 bg-primary/10 shadow-[0_0_24px_rgba(99,102,241,0.12)]'
                    : 'border-white/8 bg-black/10 hover:border-primary/25 hover:bg-black/15'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ${meta.accentClassName}`}>
                      <span className="material-symbols-outlined text-base">{meta.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Step {index + 1}</p>
                      <p className="truncate text-sm font-medium text-foreground">{getNodeTitle(node)}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${status.badgeClassName}`}>
                    {status.label}
                  </span>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">{meta.description}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/90">
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
      </section>

      <Link
        href="/settings"
        className="mt-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ⚙ 设置
      </Link>
    </aside>
  );
}
