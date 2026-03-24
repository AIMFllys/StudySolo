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
        className="fixed z-50 w-36 overflow-hidden rounded-xl border-[1.5px] border-border/50 node-paper-bg py-1.5 text-sm shadow-md backdrop-blur-sm"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <button
          className="w-full px-4 py-1.5 text-left font-serif font-medium tracking-wide text-foreground transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onRename(contextMenu.workflowId)}
          disabled={isProcessing}
        >
          重命名
        </button>
        <button
          className="w-full px-4 py-1.5 text-left font-serif font-medium tracking-wide text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onDelete(contextMenu.workflowId)}
          disabled={isProcessing}
        >
          {isProcessing ? '处理中...' : '删除'}
        </button>
      </div>
    </>
  );
}
