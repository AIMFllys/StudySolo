'use client';

import { memo, useCallback } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { X, Repeat } from 'lucide-react';

/**
 * LoopRegionNode — 循环区域标记块
 * 由 loop 类型 edge 自动生成
 * 虚线边框 + 循环标题 + 支持拖拽和删除
 * 无执行意义，仅作视觉辅助
 */
function LoopRegionNode({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as { label?: string; edgeId?: string };
  const label = nodeData.label || '循环区域';

  const handleDelete = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('canvas:delete-annotation', { detail: { nodeId: id } })
    );
  }, [id]);

  return (
    <div
      className={`loop-region-node ${selected ? 'loop-region-selected' : ''}`}
      title="循环区域 — 仅作视觉辅助"
    >
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={!!selected}
        lineClassName="!border-emerald-500/50"
        handleClassName="!bg-emerald-500 !border-emerald-600"
      />

      {/* Header */}
      <div className="loop-region-header">
        <Repeat className="h-3.5 w-3.5" />
        <span>{label}</span>
        {selected && (
          <button
            type="button"
            className="loop-region-delete"
            onClick={handleDelete}
            title="删除循环区域"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default memo(LoopRegionNode);
