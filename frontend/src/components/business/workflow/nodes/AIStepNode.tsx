'use client';

import { createElement, memo, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { AIStepNodeData } from '@/types';
import { getRenderer } from './index';

interface ExtendedNodeData extends AIStepNodeData {
  output_format?: string;
}

const STATUS_CONFIG: Record<string, [string, string, string]> = {
  pending: ['bg-muted', 'text-muted-foreground', '等待中'],
  running: ['bg-primary/20 bg-opacity-20', 'text-primary', '运行中'],
  done: ['bg-accent/10 bg-opacity-10', 'text-accent', '完成'],
  error: ['bg-destructive/10 bg-opacity-10', 'text-destructive', '错误'],
  paused: ['bg-muted', 'text-muted-foreground', '暂停'],
};

const STATUS_BORDER: Record<string, string> = {
  pending: 'border-border',
  running: 'border-primary/40 animate-border-pulse',
  done: 'border-accent/30',
  error: 'border-destructive/30',
  paused: 'border-border',
};

function AIStepNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ExtendedNodeData;
  const { label, status, output } = nodeData;
  const nodeType = nodeData.type ?? 'chat_response';
  const [copied, setCopied] = useState(false);

  const isActive = status === 'running' || selected;
  const cardClass = isActive ? 'glass-active' : 'glass-card';
  const borderClass = STATUS_BORDER[status] ?? 'border-border';
  const [badgeBg, badgeText, badgeLabel] = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  const handleCopy = async () => {
    if (!output) {
      return;
    }

    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${cardClass} border ${borderClass} rounded-xl w-64`} role="article" aria-label={`节点: ${label}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !rounded-full !bg-slate-600 hover:!bg-primary !border-0 !-left-1.5"
      />

      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border rounded-t-xl">
        <div className="flex items-center gap-2 min-w-0">
          {status === 'running' ? (
            <span className="material-symbols-outlined text-sm text-primary animate-spin">progress_activity</span>
          ) : null}
          <span className="text-xs font-medium truncate text-[var(--ss-text-main)]">{label}</span>
        </div>

        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
          {badgeLabel}
        </span>
      </div>

      {output || status === 'running' ? (
        <div className="px-3 py-2 overflow-y-auto" style={{ maxHeight: 200 }}>
          {createElement(getRenderer(nodeType), {
            output: output || '',
            format: nodeData.output_format || 'markdown',
            nodeType,
            isStreaming: status === 'running',
          })}
        </div>
      ) : null}

      {status === 'done' && output ? (
        <div className="px-3 py-1.5 border-t border-border">
          <button
            onClick={() => void handleCopy()}
            className="text-[10px] text-[var(--ss-text-muted)] hover:text-[var(--ss-text-main)] transition-colors"
            aria-label="复制输出内容"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      ) : null}

      {status === 'error' ? <div className="px-3 py-2 text-xs text-destructive">执行失败，请检查配置后重试</div> : null}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !rounded-full !bg-slate-600 hover:!bg-primary !border-0 !-right-1.5"
      />
    </div>
  );
}

export default memo(AIStepNode);
