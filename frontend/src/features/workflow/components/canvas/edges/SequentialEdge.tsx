'use client';

import { memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Sequential Edge — 顺序流连线
 * 实心手绘笔触 + 标准箭头
 * 选中态加粗 + 发光
 */
function SequentialEdge({
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

  const filterId = `pencil-seq-${id}`;
  const label = (data as Record<string, unknown>)?.label as string | undefined;

  const pencilFilter = useMemo(
    () => (
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.03"
            numOctaves="3"
            seed={Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.2"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    ),
    [filterId, id]
  );

  return (
    <>
      {pencilFilter}

      {/* Background stroke for depth */}
      <path
        d={edgePath}
        fill="none"
        stroke="var(--edge-color-sequential, #78716c)"
        strokeWidth={selected ? 5 : 3.5}
        strokeOpacity={0.15}
        filter={`url(#${filterId})`}
      />

      {/* Main ink stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: 'var(--edge-color-sequential, #78716c)',
          strokeWidth: selected ? 3 : 2,
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
          stroke="var(--edge-color-sequential, #78716c)"
          strokeWidth={6}
          strokeOpacity={0.12}
          filter={`url(#${filterId})`}
        />
      )}

      {/* Optional label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            className="edge-label-container"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SequentialEdge);
