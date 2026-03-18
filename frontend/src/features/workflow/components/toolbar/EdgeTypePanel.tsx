'use client';

import { memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { EdgeType } from '@/types';

interface EdgeTypePanelProps {
  onClose: () => void;
}

const EDGE_TYPE_OPTIONS: {
  type: EdgeType;
  label: string;
  description: string;
  icon: string;
  preview: string; // ASCII art preview of line style
  color: string;
}[] = [
  {
    type: 'sequential',
    label: '顺序流',
    description: '做完 A → 接着做 B',
    icon: '→',
    preview: '════════▶',
    color: 'var(--edge-color-sequential, #78716c)',
  },
  {
    type: 'conditional',
    label: '条件分支',
    description: '满足条件走此路径',
    icon: '⑂',
    preview: '─ ─ ─ ─ ▷',
    color: 'var(--edge-color-conditional, #d97706)',
  },
  {
    type: 'loop',
    label: '循环迭代',
    description: '对集合中每项重复',
    icon: '🔄',
    preview: '∿∿∿∿∿∿▶',
    color: 'var(--edge-color-loop, #059669)',
  },
];

function EdgeTypePanel({ onClose }: EdgeTypePanelProps) {
  const activeEdgeType = useWorkflowStore((s) => s.activeEdgeType);
  const setActiveEdgeType = useWorkflowStore((s) => s.setActiveEdgeType);

  const handleSelect = useCallback(
    (type: EdgeType) => {
      setActiveEdgeType(type);
    },
    [setActiveEdgeType]
  );

  return (
    <div
      className="edge-type-panel"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-foreground/60">
          连线类型
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors"
          aria-label="关闭面板"
        >
          <X size={14} strokeWidth={2.5} className="text-foreground/50" />
        </button>
      </div>

      {/* Edge type options */}
      <div className="flex flex-col gap-1.5">
        {EDGE_TYPE_OPTIONS.map((option) => {
          const isActive = activeEdgeType === option.type;
          return (
            <button
              key={option.type}
              onClick={() => handleSelect(option.type)}
              className={`edge-type-option ${isActive ? 'edge-type-option-active' : ''}`}
              style={{
                '--option-color': option.color,
              } as React.CSSProperties}
            >
              {/* Line preview */}
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="text-sm flex-shrink-0"
                  style={{ color: option.color }}
                >
                  {option.icon}
                </span>
                <div className="min-w-0 text-left">
                  <div className="text-[12px] font-bold font-serif text-foreground/90 leading-tight">
                    {option.label}
                  </div>
                  <div className="text-[10px] text-foreground/50 font-mono tracking-wide truncate">
                    {option.preview}
                  </div>
                </div>
              </div>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: option.color }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Hint */}
      <p className="mt-3 px-1 text-[9px] font-mono text-foreground/30 tracking-wide leading-relaxed">
        选择类型后，拖拽或点击 Handle 建连
      </p>
    </div>
  );
}

export default memo(EdgeTypePanel);
