'use client';

import { memo, useCallback } from 'react';
import { type NodeProps, NodeResizer } from '@xyflow/react';
import { X } from 'lucide-react';
import { eventBus } from '@/lib/events/event-bus';

interface AnnotationNodeData {
  emoji: string;
  label?: string;
}

/**
 * Canvas annotation node — renders an emoji on the canvas.
 * Can be dragged, selected, and deleted.
 */
function AnnotationNode({ id, data, selected }: NodeProps) {
  const { emoji } = data as unknown as AnnotationNodeData;

  const handleDelete = useCallback(() => {
    eventBus.emit('canvas:delete-annotation', { nodeId: id });
  }, [id]);

  return (
    <div
      className={`canvas-annotation-node ${selected ? 'selected' : ''}`}
      title="画布标注"
    >
      <NodeResizer minWidth={30} minHeight={30} isVisible={!!selected} />
      <span className="canvas-annotation-emoji">{emoji}</span>
      {selected && (
        <button
          type="button"
          className="canvas-annotation-delete"
          onClick={handleDelete}
          title="删除标注"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

export default memo(AnnotationNode);
