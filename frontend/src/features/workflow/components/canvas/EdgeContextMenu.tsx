'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Pencil, ArrowLeftRight, Trash2, Clock3 } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import { deleteEdge, reverseEdge, updateEdgeNote, updateEdgeWaitSeconds } from '@/features/workflow/utils/edge-actions';
import { normalizeWaitSeconds } from '@/features/workflow/utils/edge-display';

interface EdgeContextMenuProps {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
}

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

  const handleEditNote = useCallback(() => {
    const edge = getEdge();
    if (!edge) return;
    const currentNote = ((edge.data as Record<string, unknown>)?.note as string) || '';
    const newNote = prompt('编辑备注:', currentNote);
    if (newNote !== null) {
      updateEdgeNote(edgeId, newNote);
    }
    onClose();
  }, [edgeId, getEdge, onClose]);

  const handleSetWaitSeconds = useCallback(() => {
    const edge = getEdge();
    if (!edge) return;
    const currentWait = normalizeWaitSeconds((edge.data as Record<string, unknown> | undefined)?.waitSeconds);
    const input = prompt('设置等待时间（秒，0-300，可输入 0 清除）:', String(currentWait));
    if (input === null) {
      onClose();
      return;
    }

    const parsed = Number(input.trim());
    if (Number.isFinite(parsed)) {
      updateEdgeWaitSeconds(edgeId, normalizeWaitSeconds(parsed));
    }
    onClose();
  }, [edgeId, getEdge, onClose]);

  const handleReverse = useCallback(() => {
    reverseEdge(edgeId);
    onClose();
  }, [edgeId, onClose]);

  const handleDelete = useCallback(() => {
    deleteEdge(edgeId);
    onClose();
  }, [edgeId, onClose]);

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
      {/* Edit note */}
      <button className="canvas-context-menu-item" onClick={handleEditNote}>
        <Pencil size={13} className="canvas-context-menu-icon" />
        <span>编辑备注</span>
        <span className="canvas-context-menu-shortcut">双击</span>
      </button>

      <button className="canvas-context-menu-item" onClick={handleSetWaitSeconds}>
        <Clock3 size={13} className="canvas-context-menu-icon" />
        <span>设置等待时间</span>
      </button>

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
