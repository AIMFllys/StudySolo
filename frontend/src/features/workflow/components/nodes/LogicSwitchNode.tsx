'use client';

/**
 * LogicSwitchNode — 条件分支节点（菱形 / 分叉形）
 *
 * 使用 SVG 菱形轮廓代替标准矩形卡片，
 * 体现「判断/分支」的语义。
 * - 左侧入口 Handle（target）
 * - 右侧上下两个出口 Handle（分支 A / B）
 *
 * 分支管理面板在选中时展示在菱形下方。
 */

import { memo, useCallback, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitFork, Settings2 } from 'lucide-react';
import type { AIStepNodeData } from '@/types';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import BranchManagerPanel from './BranchManagerPanel';
import { NodeResultSlip } from './NodeResultSlip';

type SwitchData = AIStepNodeData & { hideSlip?: boolean };

const DIAMOND_W = 200;
const DIAMOND_H = 120;

function LogicSwitchNode({ data, selected, id }: NodeProps) {
  const nodeData = data as unknown as SwitchData;
  const { status, output, output_format, error, input_snapshot, execution_time_ms } = nodeData;
  const label = nodeData.label || '条件分支';

  const showAllNodeSlips = useWorkflowStore((s) => s.showAllNodeSlips);
  const clickConnectState = useWorkflowStore((s) => s.clickConnectState);
  const isWaitingTarget = clickConnectState.phase === 'waiting-target';

  const [activePart, setActivePart] = useState<'card' | 'slip'>('card');
  const hideSlip = nodeData.hideSlip === true;
  const isSlipVisible = showAllNodeSlips && !hideSlip;

  const isRunning = status === 'running';
  const isDone = status === 'done';

  const handleHandleClick = useCallback(
    (e: React.MouseEvent, handleId: string, handleType: 'source' | 'target') => {
      e.stopPropagation();
      const store = useWorkflowStore.getState();
      const state = store.clickConnectState;
      if (handleType === 'source') {
        if (state.phase === 'idle') {
          store.startClickConnect(id, handleId);
        } else if (state.phase === 'waiting-target' && state.sourceNodeId === id) {
          store.cancelClickConnect();
        } else {
          store.startClickConnect(id, handleId);
        }
      } else {
        if (state.phase === 'waiting-target') {
          store.completeClickConnect(id, handleId);
        }
      }
    },
    [id],
  );

  // Diamond path (pointy rhombus)
  const cx = DIAMOND_W / 2;
  const cy = DIAMOND_H / 2;
  const diamondPath = `M ${cx} 0 L ${DIAMOND_W} ${cy} L ${cx} ${DIAMOND_H} L 0 ${cy} Z`;

  return (
    <div
      className="relative transition-all duration-200"
      style={{ width: DIAMOND_W, minHeight: DIAMOND_H }}
      role="article"
      aria-label={`条件分支节点: ${label}`}
    >
      {/* Target Handle — left point of diamond */}
      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className={`node-handle !h-3 !w-3 !border-2 !border-background !bg-amber-500 z-30 ${isWaitingTarget ? 'node-handle-click-target' : ''}`}
        style={{ top: '50%', left: -4 }}
        onClick={(e) => handleHandleClick(e, 'target-left', 'target')}
      />

      {/* SVG Diamond Shape */}
      <svg
        className="absolute inset-0 z-0"
        width={DIAMOND_W}
        height={DIAMOND_H}
        viewBox={`0 0 ${DIAMOND_W} ${DIAMOND_H}`}
      >
        <defs>
          <linearGradient id={`switch-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={selected ? '#f59e0b' : '#fbbf24'} stopOpacity="0.25" />
            <stop offset="100%" stopColor={selected ? '#d97706' : '#f59e0b'} stopOpacity="0.08" />
          </linearGradient>
          <filter id={`switch-glow-${id}`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="1" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={selected ? 0.35 : 0.15} />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d={diamondPath}
          fill={`url(#switch-grad-${id})`}
          stroke={selected ? '#f59e0b' : '#d4a050'}
          strokeWidth={selected ? 2.5 : 1.5}
          strokeDasharray={isDone ? 'none' : isRunning ? '6 3' : 'none'}
          filter={`url(#switch-glow-${id})`}
          className="transition-all duration-300"
          style={{
            fill: isDone
              ? 'rgba(16, 185, 129, 0.15)'
              : isRunning
                ? 'rgba(14, 165, 233, 0.15)'
                : undefined,
            stroke: isDone
              ? '#10b981'
              : isRunning
                ? '#0ea5e9'
                : undefined,
          }}
        />
      </svg>

      {/* Content overlay inside diamond */}
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8"
        onClick={() => setActivePart('card')}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <GitFork className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 tracking-wider uppercase">
            SWITCH
          </span>
          {isRunning && (
            <span className="rounded-sm border border-cyan-500/40 bg-cyan-500/10 px-1 py-0.5 text-[8px] tracking-[0.18em] text-cyan-600 animate-pulse">
              EVAL
            </span>
          )}
          {isDone && (
            <span className="rounded-sm border border-green-500/40 bg-green-500/10 px-1 py-0.5 text-[8px] tracking-[0.18em] text-green-600">
              OK
            </span>
          )}
        </div>
        <p className="text-[11px] text-center text-black/60 dark:text-white/60 font-serif max-w-[120px] line-clamp-2 leading-tight">
          {label}
        </p>
        {/* Config gear */}
        <button
          type="button"
          className="absolute top-2 right-2 rounded-sm border border-black/10 p-1 text-black/30 hover:bg-black/5 hover:text-black dark:border-white/10 dark:text-white/30 dark:hover:bg-white/5 dark:hover:text-white transition-colors z-20"
          title="配置条件"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            window.dispatchEvent(new CustomEvent('workflow:open-node-config', {
              detail: {
                nodeId: id,
                anchorRect: {
                  top: rect.top, left: rect.left,
                  right: rect.right, bottom: rect.bottom,
                  width: rect.width, height: rect.height,
                },
              },
            }));
          }}
        >
          <Settings2 className="h-3 w-3" />
        </button>
      </div>

      {/* Source Handles — two fork outputs on right side */}
      <Handle
        type="source"
        id="branch-a"
        position={Position.Right}
        className="node-handle !h-2.5 !w-2.5 !border-2 !border-background !bg-emerald-500 z-30"
        style={{ top: '30%', right: -4 }}
        onClick={(e) => handleHandleClick(e, 'branch-a', 'source')}
      />
      <Handle
        type="source"
        id="branch-b"
        position={Position.Right}
        className="node-handle !h-2.5 !w-2.5 !border-2 !border-background !bg-orange-500 z-30"
        style={{ top: '70%', right: -4 }}
        onClick={(e) => handleHandleClick(e, 'branch-b', 'source')}
      />

      {/* Branch labels */}
      <div
        className="absolute z-20 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400"
        style={{ top: '22%', right: -28 }}
      >
        A
      </div>
      <div
        className="absolute z-20 text-[9px] font-mono font-bold text-orange-600 dark:text-orange-400"
        style={{ top: '65%', right: -28 }}
      >
        B
      </div>

      {/* Branch manager + result slip below the diamond */}
      {selected && (
        <div className="mt-2 w-full z-0">
          <BranchManagerPanel nodeId={id} />
        </div>
      )}

      {isSlipVisible && (
        <div className="mt-2">
          <NodeResultSlip
            nodeId={id}
            status={status}
            output={output || ''}
            error={error}
            inputSnapshot={input_snapshot}
            nodeType="logic_switch"
            outputFormat={output_format}
            executionTimeMs={execution_time_ms}
            isSelected={selected && activePart === 'slip'}
            onFocusSlip={() => setActivePart('slip')}
          />
        </div>
      )}
    </div>
  );
}

export default memo(LogicSwitchNode);
