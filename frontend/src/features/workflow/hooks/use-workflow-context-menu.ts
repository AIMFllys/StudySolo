import { useCallback, useState } from 'react';

interface WorkflowContextMenuState {
  x: number;
  y: number;
  workflowId: string;
}

export function useWorkflowContextMenu() {
  const [contextMenu, setContextMenu] = useState<WorkflowContextMenuState | null>(null);

  const handleContextMenu = useCallback((event: React.MouseEvent, workflowId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, workflowId });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
  };
}
