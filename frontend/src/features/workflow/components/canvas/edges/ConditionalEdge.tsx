'use client';

import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

/**
 * Conditional Edge — 条件分支连线
 * 虚线 (dash) + amber 色系 + 必须显示条件标签
 * 双击标签进入编辑模式
 */
function ConditionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as Record<string, unknown> | undefined;
  const label = (edgeData?.label as string) || '条件';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const filterId = `pencil-cond-${id}`;

  const pencilFilter = useMemo(
    () => (
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.025"
            numOctaves="2"
            seed={Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.0"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    ),
    [filterId, id]
  );

  const handleDoubleClick = useCallback(() => {
    setEditValue(label);
    setIsEditing(true);
  }, [label]);

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editValue.trim() && editValue !== label) {
      const edges = useWorkflowStore.getState().edges;
      const updatedEdges = edges.map((e) =>
        e.id === id ? { ...e, data: { ...((e.data || {}) as Record<string, unknown>), label: editValue.trim() } } : e
      );
      useWorkflowStore.getState().setEdges(updatedEdges);
    }
  }, [editValue, label, id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') setIsEditing(false);
    },
    [handleSave]
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <>
      {pencilFilter}

      {/* Background stroke */}
      <path
        d={edgePath}
        fill="none"
        stroke="var(--edge-color-conditional, #d97706)"
        strokeWidth={selected ? 5 : 3.5}
        strokeOpacity={0.12}
        strokeDasharray="8 5"
        filter={`url(#${filterId})`}
      />

      {/* Main dashed stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: 'var(--edge-color-conditional, #d97706)',
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: '8 5',
          filter: `url(#${filterId})`,
          transition: 'stroke-width 0.15s ease',
          ...style,
        }}
      />

      {/* Selected glow */}
      {selected && (
        <path
          d={edgePath}
          fill="none"
          stroke="var(--edge-color-conditional, #d97706)"
          strokeWidth={6}
          strokeOpacity={0.1}
          strokeDasharray="8 5"
          filter={`url(#${filterId})`}
        />
      )}

      {/* Condition label — always visible, double-click to edit */}
      <EdgeLabelRenderer>
        <div
          className={`edge-label-container ${isEditing ? 'edge-label-editing' : ''}`}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            borderColor: 'var(--edge-color-conditional, #d97706)',
            color: 'var(--edge-color-conditional, #d97706)',
          }}
          onDoubleClick={handleDoubleClick}
          title="双击编辑条件"
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="edge-label-editing"
              style={{
                width: `${Math.max(editValue.length * 12, 40)}px`,
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                padding: 0,
                margin: 0,
                outline: 'none',
              }}
            />
          ) : (
            <span style={{ fontStyle: 'italic' }}>⑂ {label}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(ConditionalEdge);
