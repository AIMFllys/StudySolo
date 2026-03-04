'use client';

interface WorkflowContextMenuState {
  x: number;
  y: number;
  workflowId: string;
}

interface SidebarContextMenuProps {
  contextMenu: WorkflowContextMenuState;
  processingWorkflowId: string | null;
  onClose: () => void;
  onRename: (workflowId: string) => void;
  onDelete: (workflowId: string) => void;
}

export function SidebarContextMenu({
  contextMenu,
  processingWorkflowId,
  onClose,
  onRename,
  onDelete,
}: SidebarContextMenuProps) {
  const isProcessing = processingWorkflowId === contextMenu.workflowId;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-40 rounded-lg border border-border bg-card py-1 text-sm shadow-lg"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <button
          className="w-full px-3 py-2 text-left text-foreground transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onRename(contextMenu.workflowId)}
          disabled={isProcessing}
        >
          重命名
        </button>
        <button
          className="w-full px-3 py-2 text-left text-destructive transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onDelete(contextMenu.workflowId)}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : '删除'}
        </button>
      </div>
    </>
  );
}
