'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Pencil, ArrowLeftRight, Trash2, GitBranch, Repeat, ArrowRight } from 'lucide-react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { EdgeType } from '@/types';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
}

const EDGE_TYPE_MAP: { type: EdgeType; label: string; icon: React.ReactNode }[] = [
  { type: 'sequential', label: '顺序流', icon: <ArrowRight size={13} /> },
  { type: 'conditional', label: '条件分支', icon: <GitBranch size={13} /> },
  { type: 'loop', label: '循环迭代', icon: <Repeat size={13} /> },
];

export default function EdgeContextMenu({ x, y, edgeId, onClose }: EdgeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const getEdge = useCallback(() => {
    return useWorkflowStore.getState().edges.find((e) => e.id === edgeId);
  }, [edgeId]);

  const handleEditLabel = useCallback(() => {
    const edge = getEdge();
    if (!edge) return;
    const currentLabel = ((edge.data as Record<string, unknown>)?.label as string) || '';
    const newLabel = prompt('编辑连线标签:', currentLabel);
    if (newLabel !== null) {
      const edges = useWorkflowStore.getState().edges;
      useWorkflowStore.getState().takeSnapshot();
      useWorkflowStore.getState().setEdges(
        edges.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...((e.data || {}) as Record<string, unknown>), label: newLabel } }
            : e
        )
      );
    }
    onClose();
  }, [edgeId, getEdge, onClose]);

  const handleChangeType = useCallback(
    (newType: EdgeType) => {
      const edges = useWorkflowStore.getState().edges;
      useWorkflowStore.getState().takeSnapshot();
      useWorkflowStore.getState().setEdges(
        edges.map((e) => {
          if (e.id !== edgeId) return e;
          const edgeData = (e.data || {}) as Record<string, unknown>;
          return {
            ...e,
            type: newType,
            data: {
              ...edgeData,
              label: newType === 'conditional' ? (edgeData.label || '条件') : edgeData.label,
            },
          };
        })
      );
      onClose();
    },
    [edgeId, onClose]
  );

  const handleReverse = useCallback(() => {
    const edges = useWorkflowStore.getState().edges;
    useWorkflowStore.getState().takeSnapshot();
    useWorkflowStore.getState().setEdges(
      edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: e.targetHandle?.replace('target-', 'source-') ?? null,
          targetHandle: e.sourceHandle?.replace('source-', 'target-') ?? null,
        };
      })
    );
    onClose();
  }, [edgeId, onClose]);

  const handleDelete = useCallback(() => {
    useWorkflowStore.getState().takeSnapshot();
    const edges = useWorkflowStore.getState().edges;
    useWorkflowStore.getState().setEdges(edges.filter((e) => e.id !== edgeId));
    onClose();
  }, [edgeId, onClose]);

  const currentEdge = getEdge();
  const currentType = (currentEdge?.type as EdgeType) || 'sequential';

  return (
    <div
      ref={menuRef}
      className="canvas-context-menu"
      style={{
        left: x,
        top: y,
        position: 'fixed',
        zIndex: 1000,
      }}
    >
      {/* Edit label */}
      <button className="canvas-context-menu-item" onClick={handleEditLabel}>
        <Pencil size={13} className="canvas-context-menu-icon" />
        <span>编辑标签</span>
        <span className="canvas-context-menu-shortcut">双击</span>
      </button>

      <div className="canvas-context-menu-divider" />

      {/* Change type */}
      {EDGE_TYPE_MAP.map((option) => (
        <button
          key={option.type}
          className={`canvas-context-menu-item ${currentType === option.type ? 'opacity-50' : ''}`}
          onClick={() => handleChangeType(option.type)}
          disabled={currentType === option.type}
        >
          <span className="canvas-context-menu-icon">{option.icon}</span>
          <span>
            {option.label}
            {currentType === option.type && ' ✓'}
          </span>
        </button>
      ))}

      <div className="canvas-context-menu-divider" />

      {/* Reverse direction */}
      <button className="canvas-context-menu-item" onClick={handleReverse}>
        <ArrowLeftRight size={13} className="canvas-context-menu-icon" />
        <span>反转方向</span>
      </button>

      {/* Delete */}
      <button
        className="canvas-context-menu-item canvas-context-menu-item-danger"
        onClick={handleDelete}
      >
        <Trash2 size={13} className="canvas-context-menu-icon" />
        <span>删除连线</span>
        <span className="canvas-context-menu-shortcut">DEL</span>
      </button>
    </div>
  );
}
