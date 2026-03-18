'use client';

import { memo, useMemo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Pencil-style edge with hand-drawn ink aesthetic.
 * Uses an SVG turbulence filter for a sketchy, organic feel.
 * Active edges (animated=true) get a subtle pulse glow.
 */
function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  animated,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const filterId = `pencil-filter-${id}`;

  // Pencil-style SVG filter — slight jitter for hand-drawn look
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

      {/* Background stroke — thicker, softer for depth */}
      <path
        d={edgePath}
        fill="none"
        className="pencil-edge-bg"
        filter={`url(#${filterId})`}
      />

      {/* Main ink stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          filter: `url(#${filterId})`,
          ...style,
        }}
        className={`pencil-edge-main ${animated ? 'pencil-edge-active' : ''}`}
      />

      {/* Glow layer for active/running edges */}
      {animated && (
        <path
          d={edgePath}
          fill="none"
          className="pencil-edge-glow"
          filter={`url(#${filterId})`}
        />
      )}
    </>
  );
}

export default memo(AnimatedEdge);
