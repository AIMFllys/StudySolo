'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Pencil, ArrowLeftRight, Trash2, Timer, GitBranch } from 'lucide-react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

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

  /** 是否为 logic_switch 出发的分支线 */
  const isBranchEdge = useCallback(() => {
    const edge = getEdge();
    if (!edge) return false;
    const sourceNode = useWorkflowStore.getState().nodes.find((n) => n.id === edge.source);
    const sourceType = (sourceNode?.data as Record<string, unknown>)?.type ?? sourceNode?.type;
    return sourceType === 'logic_switch';
  }, [getEdge]);

  const handleEditNote = useCallback(() => {
    const edge = getEdge();
    if (!edge) return;
    const edgeData = (edge.data || {}) as Record<string, unknown>;

    if (isBranchEdge()) {
      const current = (edgeData.branch as string) || '';
      const newVal = prompt('编辑分支标签:', current);
      if (newVal !== null) {
        useWorkflowStore.getState().takeSnapshot();
        useWorkflowStore.getState().setEdges(
          useWorkflowStore.getState().edges.map((e) =>
            e.id === edgeId ? { ...e, data: { ...edgeData, branch: newVal } } : e
          )
        );
      }
    } else {
      const current = (edgeData.note as string) || '';
      const newVal = prompt('编辑备注:', current);
      if (newVal !== null) {
        useWorkflowStore.getState().takeSnapshot();
        useWorkflowStore.getState().setEdges(
          useWorkflowStore.getState().edges.map((e) =>
            e.id === edgeId ? { ...e, data: { ...edgeData, note: newVal } } : e
          )
        );
      }
    }
    onClose();
  }, [edgeId, getEdge, isBranchEdge, onClose]);

  const handleSetWait = useCallback(() => {
    const edge = getEdge();
    if (!edge) return;
    const edgeData = (edge.data || {}) as Record<string, unknown>;
    const current = (edgeData.waitSeconds as number) || 0;
    const input = prompt('等待时间 (秒, 0~300):', String(current));
    if (input === null) { onClose(); return; }

    const seconds = Math.max(0, Math.min(300, parseFloat(input) || 0));
    useWorkflowStore.getState().takeSnapshot();
    useWorkflowStore.getState().setEdges(
      useWorkflowStore.getState().edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...edgeData, waitSeconds: seconds } } : e
      )
    );
    onClose();
  }, [edgeId, getEdge, onClose]);

  const handleReverse = useCallback(() => {
    const reverseHandleMap: Record<string, string> = {
      'source-right': 'target-left',
      'source-bottom': 'target-top',
      'target-left': 'source-right',
      'target-top': 'source-bottom',
    };

    const edges = useWorkflowStore.getState().edges;
    useWorkflowStore.getState().takeSnapshot();
    useWorkflowStore.getState().setEdges(
      edges.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          source: e.target,
          target: e.source,
          sourceHandle: reverseHandleMap[e.targetHandle ?? ''] ?? 'source-right',
          targetHandle: reverseHandleMap[e.sourceHandle ?? ''] ?? 'target-left',
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

  const branchMode = isBranchEdge();

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
      {/* Edit note / branch label */}
      <button className="canvas-context-menu-item" onClick={handleEditNote}>
        {branchMode ? (
          <GitBranch size={13} className="canvas-context-menu-icon" />
        ) : (
          <Pencil size={13} className="canvas-context-menu-icon" />
        )}
        <span>{branchMode ? '编辑分支标签' : '编辑备注'}</span>
        <span className="canvas-context-menu-shortcut">双击</span>
      </button>

      {/* Set wait time (only for non-branch edges) */}
      {!branchMode && (
        <button className="canvas-context-menu-item" onClick={handleSetWait}>
          <Timer size={13} className="canvas-context-menu-icon" />
          <span>设置等待时间</span>
        </button>
      )}

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
