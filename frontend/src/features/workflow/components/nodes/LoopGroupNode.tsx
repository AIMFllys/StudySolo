'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer, type NodeProps } from '@xyflow/react';
import { Repeat, Settings } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';

interface LoopGroupData {
  label?: string;
  maxIterations?: number;
  intervalSeconds?: number;
  description?: string;
  [key: string]: unknown;
}

/**
 * LoopGroupNode — 可缩放的循环容器块
 *
 * 使用 React Flow Group Node 特性:
 * - NodeResizer: 四向缩放
 * - parentId + extent: 子节点自动限制在容器内
 * - LEFT=target, RIGHT=source handle
 */
function LoopGroupNode({ id, data, selected }: NodeProps) {
  const groupData = data as LoopGroupData;
  const maxIterations = groupData.maxIterations ?? 3;
  const intervalSeconds = groupData.intervalSeconds ?? 0;
  const label = groupData.label || '循环块';
  const currentIteration = groupData.currentIteration as number | undefined;
  const totalIterations = groupData.totalIterations as number | undefined;
  const status = groupData.status as string | undefined;

  const [isEditingParams, setIsEditingParams] = useState(false);
  const [editIter, setEditIter] = useState(String(maxIterations));
  const [editInterval, setEditInterval] = useState(String(intervalSeconds));
  const iterRef = useRef<HTMLInputElement>(null);

  const handleSaveParams = useCallback(() => {
    const iter = Math.max(1, Math.min(100, parseInt(editIter) || 3));
    const interval = Math.max(0, Math.min(300, parseFloat(editInterval) || 0));
    const store = useWorkflowStore.getState();
    store.takeSnapshot();
    store.setNodes(
      store.nodes.map((n) =>
        n.id === id
          ? { ...n, data: { ...n.data, maxIterations: iter, intervalSeconds: interval } }
          : n
      )
    );
    setIsEditingParams(false);
  }, [id, editIter, editInterval]);

  useEffect(() => {
    if (isEditingParams && iterRef.current) {
      iterRef.current.focus();
      iterRef.current.select();
    }
  }, [isEditingParams]);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={300}
        minHeight={200}
        lineClassName="loop-group-resizer-line"
        handleClassName="loop-group-resizer-handle"
      />

      {/* Target handle (input) */}
      <Handle
        type="target"
        id="target-left"
        position={Position.Left}
        className="node-handle !h-3.5 !w-3.5 !-left-[9px] !border-2 !border-background !bg-emerald-500 z-20"
      />

      {/* Container body */}
      <div className={`loop-group-container ${status === 'running' ? 'loop-group-container-running' : ''}`}>
        {/* Header bar */}
        <div className="loop-group-header">
          <div className="flex items-center gap-1.5">
            <Repeat size={12} strokeWidth={2.5} className="text-emerald-500" />
            <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {label}
            </span>
            {typeof currentIteration === 'number' && typeof totalIterations === 'number' && (
              <span className="rounded-sm border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-mono text-emerald-700 dark:text-emerald-300">
                第 {currentIteration}/{totalIterations} 轮
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditingParams ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <label className="text-[9px] text-foreground/40">×</label>
                <input
                  ref={iterRef}
                  className="loop-group-param-input"
                  value={editIter}
                  onChange={(e) => setEditIter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveParams();
                    if (e.key === 'Escape') setIsEditingParams(false);
                  }}
                  type="number"
                  min={1}
                  max={100}
                />
                <label className="text-[9px] text-foreground/40">间隔</label>
                <input
                  className="loop-group-param-input"
                  value={editInterval}
                  onChange={(e) => setEditInterval(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveParams();
                    if (e.key === 'Escape') setIsEditingParams(false);
                  }}
                  type="number"
                  min={0}
                  max={300}
                  step={0.1}
                />
                <span className="text-[9px] text-foreground/40">s</span>
                <button
                  className="text-[9px] text-emerald-500 font-bold hover:underline"
                  onClick={handleSaveParams}
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                className="flex items-center gap-1 text-[10px] font-mono text-foreground/50 hover:text-foreground/80 transition-colors"
                onClick={() => setIsEditingParams(true)}
              >
                <Settings size={10} />
                ×{maxIterations}
                {intervalSeconds > 0 && ` / ${intervalSeconds}s`}
              </button>
            )}
          </div>
        </div>

        {/* Empty body for child nodes */}
        <div className="loop-group-body">
          <div className="pointer-events-none text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-700/45 dark:text-emerald-300/40">
            Drag nodes into this loop container
          </div>
        </div>
      </div>

      {/* Source handle (output) */}
      <Handle
        type="source"
        id="source-right"
        position={Position.Right}
        className="node-handle !h-3.5 !w-3.5 !-right-[9px] !border-2 !border-background !bg-emerald-500 z-20"
      />
    </>
  );
}

export default memo(LoopGroupNode);
