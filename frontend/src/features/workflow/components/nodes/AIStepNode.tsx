'use client';

import { createElement, memo, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Loader2 } from 'lucide-react';
import type { AIStepNodeData } from '@/types';
import { getNodePreview, getNodeTypeMeta, getStatusMeta } from '@/features/workflow/constants/workflow-meta';
import { getRenderer } from './index';
import { useWorkflowStore } from '@/stores/use-workflow-store';

function getNodeTheme(nodeType: string) {
  // 1. RAW_DATA (数据源/输入) - 灰色打孔纸质感
  if (['trigger_input'].includes(nodeType)) {
    return {
      category: 'RAW_DATA',
      borderClass: 'border border-dashed border-slate-400 dark:border-slate-500',
      innerBorderClass: 'border-none',
      headerTextColor: 'text-slate-600 dark:text-slate-400',
    };
  }
  // 2. ANALYSIS (逻辑分析) - 墨绿双线审阅质感
  if (['ai_analyzer', 'content_extract', 'compare'].includes(nodeType)) {
    return {
      category: 'ANALYSIS',
      borderClass: 'border-2 border-emerald-800 dark:border-emerald-600',
      innerBorderClass: 'border-[0.5px] border-dashed border-emerald-800/60 dark:border-emerald-500/60',
      headerTextColor: 'text-emerald-800 dark:text-emerald-500',
    };
  }
  // 3. GENERATION (内容生成) - 靛蓝厚重书写质感
  if (['outline_gen', 'summary'].includes(nodeType)) {
    return {
      category: 'GENERATION',
      borderClass: 'border-[3px] border-indigo-900 dark:border-indigo-400',
      innerBorderClass: 'border-[0.5px] border-solid border-indigo-900/40 dark:border-indigo-400/40',
      headerTextColor: 'text-indigo-900 dark:text-indigo-400',
    };
  }
  // 4. FINAL_REPORT (正式报告/终稿) - 沉稳藏青带内嵌缝线
  if (['chat_response', 'merge_polish'].includes(nodeType)) {
    return {
      category: 'FINAL_REPORT',
      borderClass: 'border-[2px] border-slate-800 dark:border-slate-300 ring-4 ring-slate-800/5 dark:ring-slate-300/5',
      innerBorderClass: 'border-[1px] border-dashed border-slate-800/30 dark:border-slate-300/30 m-1',
      headerTextColor: 'text-slate-800 dark:text-slate-300',
    };
  }
  // 5. EXTERNAL_TOOL (外部检索) - 青色胶布贴边质感
  if (['knowledge_base', 'web_search'].includes(nodeType)) {
    return {
      category: 'EXTERNAL_TOOL',
      borderClass: 'border-l-4 border-y border-r border-cyan-700 dark:border-cyan-500',
      innerBorderClass: 'border-none',
      headerTextColor: 'text-cyan-800 dark:text-cyan-500',
    };
  }
  // 6. ACTION_IO (系统读写) - 工业灰点线排版
  if (['write_db', 'export_file'].includes(nodeType)) {
    return {
      category: 'ACTION_IO',
      borderClass: 'border-[1.5px] border-dotted border-zinc-500 dark:border-zinc-400',
      innerBorderClass: 'border-[0.5px] border-solid border-zinc-500/20 dark:border-zinc-400/20',
      headerTextColor: 'text-zinc-600 dark:text-zinc-400',
    };
  }
  // 7. CONTROL_FLOW (逻辑控制) - 琥珀色警告线质感
  if (['logic_switch', 'loop_map'].includes(nodeType)) {
    return {
      category: 'CONTROL_FLOW',
      borderClass: 'border-2 border-amber-600 dark:border-amber-500',
      innerBorderClass: 'border-[0.5px] border-dashed border-amber-600/50 dark:border-amber-500/50',
      headerTextColor: 'text-amber-700 dark:text-amber-500',
    };
  }
  // 8. VISUALIZE (图表渲染) - 紫色相框质感
  if (['mind_map'].includes(nodeType)) {
    return {
      category: 'VISUALIZE',
      borderClass: 'border border-fuchsia-800 dark:border-fuchsia-500 shadow-[inset_0_0_0_2px_rgba(134,25,143,0.1)]',
      innerBorderClass: 'border-[0.5px] border-solid border-fuchsia-800/30 dark:border-fuchsia-500/30 m-2',
      headerTextColor: 'text-fuchsia-800 dark:text-fuchsia-400',
    };
  }
  // 9. ASSESSMENT (考核测试) - 玫瑰红考卷质感
  if (['quiz_gen', 'flashcard'].includes(nodeType)) {
    return {
      category: 'ASSESSMENT',
      borderClass: 'border-2 border-rose-800 dark:border-rose-400',
      innerBorderClass: 'border-t-[0.5px] border-b-[0.5px] border-solid border-rose-800/30 dark:border-rose-400/30 my-4',
      headerTextColor: 'text-rose-800 dark:text-rose-400',
    };
  }
  // 10. FEEDBACK (评估反馈) - 青绿色批改笔迹质感 (Fallback / 预留)
  return {
    category: 'FEEDBACK',
    borderClass: 'border-[1.5px] border-teal-700 dark:border-teal-500',
    innerBorderClass: 'border-[1px] border-dotted border-teal-700/40 dark:border-teal-500/40',
    headerTextColor: 'text-teal-800 dark:text-teal-400',
  };
}

function AIStepNode({ data, selected, type, id }: NodeProps) {
  const nodeData = data as unknown as AIStepNodeData;
  const { error, label, model_route, output, output_format, status } = nodeData;
  const nodeType = nodeData.type ?? type ?? 'chat_response';
  const typeMeta = getNodeTypeMeta(nodeType);
  const statusMeta = getStatusMeta(status);
  const preview = getNodePreview(output, status === 'running' ? '正在持续生成内容...' : '等待上游节点触发');
  const [copied, setCopied] = useState(false);
  const isActive = status === 'running' || selected;
  const nodeTheme = getNodeTheme(nodeType);
  
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

      {/* ── 8 Handles: 4 方位 × source/target ── */}
      {/* Target Handles (输入) */}
      <Handle type="target" id="target-left" position={Position.Left}
        className={`node-handle node-handle-target !h-3 !w-3 !-left-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-left', 'target')}
      />
      <Handle type="target" id="target-top" position={Position.Top}
        className={`node-handle node-handle-target !h-3 !w-3 !-top-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-top', 'target')}
      />
      <Handle type="target" id="target-right" position={Position.Right}
        className={`node-handle node-handle-target !h-3 !w-3 !-right-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-right', 'target')}
      />
      <Handle type="target" id="target-bottom" position={Position.Bottom}
        className={`node-handle node-handle-target !h-3 !w-3 !-bottom-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isWaitingTarget && !isSourceOfCurrentConnect ? 'node-handle-click-target' : ''}`}
        onClick={(e) => handleHandleClick(e, 'target-bottom', 'target')}
      />

      <div className="relative z-10 p-6 flex flex-col h-full min-h-[14rem]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className={`flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase font-bold ${nodeTheme.headerTextColor}`}>
            <typeMeta.icon className="h-3.5 w-3.5" />
            #{id.slice(0, 3)}_{nodeTheme.category} {status === 'running' ? '(ACTIVE)' : ''}
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
        </div>

        {/* Divider */}
        <hr className="border-t-[1px] border-dashed border-black/15 dark:border-white/15 my-4" />

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
        className={`node-handle node-handle-source !h-3 !w-3 !-right-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-right' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-right', 'source')}
      />
      <Handle type="source" id="source-bottom" position={Position.Bottom}
        className={`node-handle node-handle-source !h-3 !w-3 !-bottom-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-bottom' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-bottom', 'source')}
      />
      <Handle type="source" id="source-left" position={Position.Left}
        className={`node-handle node-handle-source !h-3 !w-3 !-left-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-left' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-left', 'source')}
      />
      <Handle type="source" id="source-top" position={Position.Top}
        className={`node-handle node-handle-source !h-3 !w-3 !-top-[8px] !border-2 !border-background !bg-current z-20 ${nodeTheme.headerTextColor} ${isSourceOfCurrentConnect && clickConnectState.sourceHandleId === 'source-top' ? 'node-handle-click-source-active' : ''}`}
        onClick={(e) => handleHandleClick(e, 'source-top', 'source')}
      />
    </div>
  );
}

export default memo(AIStepNode);
