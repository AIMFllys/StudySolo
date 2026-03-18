'use client';

import { memo, useMemo } from 'react';
import { EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Loop Edge — 循环/迭代连线
 * 波浪 SVG path (正弦偏移) + emerald 色系 + 回旋箭头
 * 手绘笔记风格的波浪线效果
 */
function LoopEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  selected,
  data,
}: EdgeProps) {
  // Get the bezier path for label positioning
  const [, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as Record<string, unknown> | undefined;
  const label = edgeData?.label as string | undefined;
  const filterId = `pencil-loop-${id}`;

  // Generate a wavy path between source and target
  const wavyPath = useMemo(() => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(Math.floor(distance / 20), 4);
    const amplitude = Math.min(8, distance * 0.04);

    let path = `M ${sourceX} ${sourceY}`;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Bezier interpolation with sine wave offset
      const cx = sourceX + dx * t;
      const cy = sourceY + dy * t;
      // Perpendicular offset for wave effect
      const angle = Math.atan2(dy, dx);
      const perpX = -Math.sin(angle);
      const perpY = Math.cos(angle);
      const wave = Math.sin(t * Math.PI * 4) * amplitude;
      const x = cx + perpX * wave;
      const y = cy + perpY * wave;

      if (i === 1) {
        path += ` Q ${sourceX + dx * 0.05 + perpX * wave} ${sourceY + dy * 0.05 + perpY * wave} ${x} ${y}`;
      } else {
        const prevT = (i - 1) / steps;
        const midT = (prevT + t) / 2;
        const midCx = sourceX + dx * midT;
        const midCy = sourceY + dy * midT;
        const midWave = Math.sin(midT * Math.PI * 4) * amplitude;
        const cpX = midCx + perpX * midWave;
        const cpY = midCy + perpY * midWave;
        path += ` Q ${cpX} ${cpY} ${x} ${y}`;
      }
    }

    return path;
  }, [sourceX, sourceY, targetX, targetY]);

  const pencilFilter = useMemo(
    () => (
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.02"
            numOctaves="2"
            seed={Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="0.8"
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
        d={wavyPath}
        fill="none"
        stroke="var(--edge-color-loop, #059669)"
        strokeWidth={selected ? 6 : 4}
        strokeOpacity={0.1}
        strokeLinecap="round"
        filter={`url(#${filterId})`}
      />

      {/* Main wavy stroke */}
      <path
        id={id}
        d={wavyPath}
        fill="none"
        stroke="var(--edge-color-loop, #059669)"
        strokeWidth={selected ? 3 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        markerEnd={markerEnd as string}
        filter={`url(#${filterId})`}
        className="react-flow__edge-path"
        style={{ transition: 'stroke-width 0.15s ease' }}
      />

      {/* Selected glow */}
      {selected && (
        <path
          d={wavyPath}
          fill="none"
          stroke="var(--edge-color-loop, #059669)"
          strokeWidth={8}
          strokeOpacity={0.08}
          strokeLinecap="round"
          filter={`url(#${filterId})`}
        />
      )}

      {/* Loop label */}
      <EdgeLabelRenderer>
        <div
          className="edge-label-container"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            borderColor: 'var(--edge-color-loop, #059669)',
            color: 'var(--edge-color-loop, #059669)',
          }}
        >
          🔄 {label || '循环'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(LoopEdge);
