'use client';

import { memo } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

/**
 * Custom animated edge with primary color gradient and pulse animation.
 * Active edges (animated=true) get a flowing gradient effect.
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
  animated,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.5,
  });

  const gradientId = `edge-gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6366F1" stopOpacity={animated ? 0.9 : 0.72} />
          <stop offset="55%" stopColor="#8B5CF6" stopOpacity={animated ? 0.96 : 0.8} />
          <stop offset="100%" stopColor="#A78BFA" stopOpacity={animated ? 0.9 : 0.72} />
        </linearGradient>
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={undefined}
        style={{
          stroke: `url(#${gradientId})`,
          strokeWidth: 2.5,
          strokeOpacity: 0.82,
          filter: animated ? 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.22))' : 'none',
          transition: 'stroke 120ms ease, stroke-opacity 120ms ease, stroke-width 120ms ease',
          ...style,
        }}
        className={animated ? 'edge-animated-pulse' : ''}
      />
      {/* Glow layer for active edges */}
      {animated && (
        <path
          d={edgePath}
          fill="none"
          stroke="#8B5CF6"
          strokeWidth={4.5}
          strokeOpacity={0.14}
          className="edge-animated-pulse"
        />
      )}
    </>
  );
}

export default memo(AnimatedEdge);
