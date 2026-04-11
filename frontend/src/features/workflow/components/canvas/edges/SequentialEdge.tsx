'use client';

import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import { updateEdgeBranch, updateEdgeNote, updateEdgeWaitSeconds } from '@/features/workflow/utils/edge-actions';
import { buildEdgeDisplayState, normalizeWaitSeconds } from '@/features/workflow/utils/edge-display';

/**
 * SequentialEdge — 唯一的连线类型
 *
 * 实心手绘笔触 + 标准箭头。
 * 支持 data.note 备注显示和双击编辑。
 * 从 logic_switch 出发时自动切换为 amber 虚线 + 分支标签。
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
  source,
}: EdgeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const edgeData = data as Record<string, unknown> | undefined;
  const note = (edgeData?.note as string) || '';
  const branch = edgeData?.branch as string | undefined;

  // Check if source is a logic_switch node for branch-style rendering
  const sourceNodeType = useWorkflowStore(
    useCallback((s) => {
      const node = s.nodes.find((n) => n.id === source);
      return (node?.data as Record<string, unknown>)?.type as string | undefined
        ?? node?.type;
    }, [source])
  );
  const isBranchEdge = sourceNodeType === 'logic_switch';

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const filterId = `pencil-seq-${id}`;

  const pencilFilter = useMemo(
    () => (
      <defs>
        <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.03"
            numOctaves={3}
            seed={Math.abs(id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 100}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={1.2}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    ),
    [filterId, id]
  );

  // Color & stroke logic
  const edgeColor = isBranchEdge
    ? 'var(--edge-color-conditional, #d97706)'
    : 'var(--edge-color-sequential, #78716c)';

  const dashArray = isBranchEdge ? '8 5' : undefined;

  // Double-click to edit note
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(
    (value: string) => {
      setIsEditing(false);
      if (isBranchEdge) {
        updateEdgeBranch(id, value);
        return;
      }
      updateEdgeNote(id, value);
    },
    [id, isBranchEdge]
  );

  const handleWaitClick = useCallback(() => {
    const currentWait = normalizeWaitSeconds(edgeData?.waitSeconds);
    const input = prompt('设置等待时间（秒，0-300，可输入 0 清除）:', String(currentWait));
    if (input === null) {
      return;
    }

    const parsed = Number(input.trim());
    if (Number.isFinite(parsed)) {
      updateEdgeWaitSeconds(id, normalizeWaitSeconds(parsed));
    }
  }, [edgeData?.waitSeconds, id]);

  // Auto-focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const display = buildEdgeDisplayState(
    {
      note,
      branch,
      waitSeconds: normalizeWaitSeconds(edgeData?.waitSeconds),
    },
    isBranchEdge,
  );
  const showLabel = Boolean(display.primaryLabel || display.waitLabel || isEditing);

  return (
    <>
      {pencilFilter}

      {/* Background stroke for depth */}
      <path
        d={edgePath}
        fill="none"
        stroke={edgeColor}
        strokeWidth={selected ? 5 : 3.5}
        strokeOpacity={0.15}
        strokeDasharray={dashArray}
        filter={`url(#${filterId})`}
      />

      {/* Main ink stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: edgeColor,
          strokeWidth: selected ? 3 : 2,
          strokeDasharray: dashArray,
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
          stroke={edgeColor}
          strokeWidth={6}
          strokeOpacity={0.12}
          filter={`url(#${filterId})`}
        />
      )}

      {/* Note / Branch label */}
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={`edge-label-container ${isBranchEdge ? 'edge-label-branch' : ''}`}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                className="edge-label-input"
                defaultValue={display.primaryLabel}
                onBlur={(e) => handleSave(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave((e.target as HTMLInputElement).value);
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
            ) : (
              <div className="flex items-center gap-1.5">
                {display.primaryLabel && <span className="text-[10px]">{display.primaryLabel}</span>}
                {display.waitLabel && (
                  <button
                    type="button"
                    className="edge-wait-badge"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleWaitClick();
                    }}
                  >
                    {display.waitLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(SequentialEdge);
