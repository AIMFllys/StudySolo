'use client';

import { createElement, memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import type { AIStepNodeData } from '@/types';
import { getNodePreview, getNodeTypeMeta, getStatusMeta, getNodeTheme } from '@/features/workflow/constants/workflow-meta';
import { getRenderer } from './index';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import BranchManagerPanel from './BranchManagerPanel';



function AIStepNode({ data, selected, type, id }: NodeProps) {
  const nodeData = data as unknown as AIStepNodeData;
  const { error, label, model_route, output, output_format, status } = nodeData;
  const nodeType = nodeData.type ?? type ?? 'chat_response';
  const typeMeta = getNodeTypeMeta(nodeType);
  const statusMeta = getStatusMeta(status);
  const preview = getNodePreview(
    output,
    status === 'running'
      ? '正在持续生成内容...'
      : status === 'waiting'
        ? '等待上游边上的延迟时间结束...'
        : status === 'skipped'
          ? '该节点被分支逻辑跳过'
          : '等待上游节点触发',
  );
  const [copied, setCopied] = useState(false);
  const isActive = status === 'running' || status === 'waiting' || selected;
  const nodeTheme = getNodeTheme(nodeType);
  const isLogicSwitch = nodeType === 'logic_switch';
  const statusBadge = status === 'running' ? '(ACTIVE)' : status === 'waiting' ? '(WAIT)' : '';
  
  const cardShadow = isActive ? 'ring-2 ring-primary/40 shadow-xl shadow-primary/10 scale-[1.02]' : '';

  const handleCopy = async () => {
    if (!output || !navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Click-to-connect
  const clickConnectState = useWorkflowStore((s) => s.clickConnectState);
  const isWaitingTarget = clickConnectState.phase === 'waiting-target';
  const isSourceOfCurrentConnect = isWaitingTarget && clickConnectState.sourceNodeId === id;

  const handleHandleClick = useCallback(
    (e: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => {
      e.stopPropagation();
      const store = useWorkflowStore.getState();
      const state = store.clickConnectState;

      if (handleType === 'source') {
        // Click on source handle → start click-connect
        if (state.phase === 'idle') {
          store.startClickConnect(id, handleId);
        } else if (state.phase === 'waiting-target' && state.sourceNodeId === id) {
          // Re-click same source → cancel
          store.cancelClickConnect();
        } else {
          // Click a different source → restart
          store.startClickConnect(id, handleId);
        }
      } else {
        // Click on target handle → complete connection or start from source
        if (state.phase === 'waiting-target') {
          store.completeClickConnect(id, handleId);
        }
      }
    },
    [id]
  );

  return (
    <div
      className={`${cardShadow} node-paper-bg relative w-[22rem] transition-all duration-200 ${nodeTheme.borderClass}`}
      role="article"
      aria-label={`节点: ${label}`}
    >
      <div className={`absolute inset-1 pointer-events-none z-0 ${nodeTheme.innerBorderClass}`} />

      {/* ── 4 Handles: LEFT/TOP=target, RIGHT/BOTTOM=source ── */}
      {/* Target Handles (输入) */}
      <Handle type="target" id="target-left" position={Position.Left}
        className={`node-handle !h-3 !w-3 !-left-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-left', 'target')}
      />
      <Handle type="target" id="target-top" position={Position.Top}
        className={`node-handle !h-3 !w-3 !-top-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-top', 'target')}
      />

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[14rem]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className={`flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase font-bold ${nodeTheme.headerTextColor}`}>
            <typeMeta.icon className="h-3.5 w-3.5" />
            #{id.slice(0, 3)}_{nodeTheme.category} {statusBadge}
            {isLogicSwitch && (
              <span className="rounded-sm border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-amber-700 dark:text-amber-300">
                BRANCH
              </span>
            )}
          </div>
          {model_route && (
            <span className="truncate rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-black/50 dark:text-white/50">
              {model_route}
            </span>
          )}
        </div>

        {/* Title & Desc */}
        <div className="mb-4 flex-1">
          <h3 className="text-[22px] font-bold font-serif text-black dark:text-white leading-tight tracking-wide mb-2">
            {label}
          </h3>
          <p className="text-[13px] text-black/60 dark:text-white/60 font-serif leading-relaxed line-clamp-2">
            {typeMeta.description}
          </p>
          {isLogicSwitch && (
            <div className="mt-3 inline-flex items-center gap-1 rounded-sm border border-dashed border-amber-500/40 bg-amber-500/5 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-300">
              ⑂ 从右侧或底部拖出分支
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-t-[1px] border-dashed border-black/15 dark:border-white/15 my-4" />

        {/* Branch manager — logic_switch only, when selected */}
        {isLogicSwitch && selected && (
          <BranchManagerPanel nodeId={id} />
        )}

        {/* Dynamic Content Area */}
        <div className="w-full min-h-[4rem]">
          {status === 'running' ? (
            <div className={`font-mono text-xs ${nodeTheme.headerTextColor}`}>
              <div className="flex items-center gap-2 mb-2 font-bold tracking-widest uppercase">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                PROCESS: RUNNING
              </div>
              <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 overflow-hidden mt-3">
                <div className="h-full bg-current w-2/3 animate-pulse" />
              </div>
              <div className="mt-3 font-serif text-sm text-black/70 dark:text-white/70 italic line-clamp-2 normal-case font-normal">
                {preview}
              </div>
            </div>
          ) : status === 'waiting' ? (
            <div className={`font-mono text-xs ${nodeTheme.headerTextColor}`}>
              <div className="flex items-center gap-2 mb-2 font-bold tracking-widest uppercase">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                PROCESS: WAITING
              </div>
              <div className="mt-3 font-serif text-sm text-black/70 dark:text-white/70 italic line-clamp-2 normal-case font-normal">
                {preview}
              </div>
            </div>
          ) : output ? (
            <div className="max-h-48 overflow-y-auto font-serif text-sm text-black/80 dark:text-white/80 leading-relaxed scrollbar-hide select-text">
              {createElement(getRenderer(nodeType), {
                output: output || '',
                format: output_format || 'markdown',
                nodeType,
                isStreaming: false,
              })}
            </div>
          ) : (
            <div className="text-sm font-serif text-black/40 dark:text-white/40 italic">
              {preview || '等待上游节点触发...'}
            </div>
          )}
        </div>

        {/* Footer info (Status badge & Copy output) */}
        <div className="mt-5 flex items-center justify-between pt-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-[10px] uppercase font-bold tracking-wider ${statusMeta.badgeClassName} bg-opacity-10`}>
            {statusMeta.label}
          </span>
          <div className="flex items-center gap-3">
            {status === 'done' && output && (
              <button
                onClick={() => void handleCopy()}
                className={`text-[10px] font-mono font-bold tracking-widest uppercase hover:underline transition-all ${nodeTheme.headerTextColor}`}
                aria-label="复制输出内容"
              >
                {copied ? 'COPIED!' : 'COPY DATA'}
              </button>
            )}
            <span className={`inline-block h-3 w-3 rounded-full ${statusMeta.dotClassName}`} />
          </div>
        </div>

        {status === 'error' && (
          <div className="mt-4 border-t border-dashed border-rose-400/30 pt-3 text-xs font-serif text-rose-500 italic">
            {error || '执行失败，请检查配置或重试当前节点'}
          </div>
        )}
      </div>

      {/* Source Handles (输出) */}
      <Handle type="source" id="source-right" position={Position.Right}
        className={`node-handle !h-3 !w-3 !-right-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-right' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-right', 'source')}
      />
      <Handle type="source" id="source-bottom" position={Position.Bottom}
        className={`node-handle !h-3 !w-3 !-bottom-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-bottom' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-bottom', 'source')}
      />
    </div>
  );
}

export default memo(AIStepNode);
