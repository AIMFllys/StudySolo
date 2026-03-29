import { useEffect, useRef, useState } from 'react';
import type { ReactFlowInstance } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

interface UseCanvasKeyboardOptions {
  reactFlowInstance: ReactFlowInstance;
  copyNodes: (nodeId?: string) => Promise<void>;
  pasteAtScreen: (screenX: number, screenY: number) => Promise<void>;
}

/**
 * Keyboard shortcuts for the workflow canvas:
 * - Ctrl+Z / Cmd+Z: undo
 * - Ctrl+Shift+Z / Ctrl+Y: redo
 * - Ctrl+C: copy selected nodes
 * - Ctrl+V: paste at mouse position
 * - Escape: cancel click-to-connect
 */
export function useCanvasKeyboard({
  reactFlowInstance,
  copyNodes,
  pasteAtScreen,
}: UseCanvasKeyboardOptions) {
  const mousePosRef = useRef({ x: 0, y: 0 });
  // Keep a state version too so the component can access it if needed
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const activeTagName = document.activeElement?.tagName.toLowerCase();
      if (activeTagName === 'input' || activeTagName === 'textarea') return;

      if (e.key === 'Escape') {
        const store = useWorkflowStore.getState();
        if (store.clickConnectState.phase !== 'idle') {
          store.cancelClickConnect();
          e.preventDefault();
          return;
        }
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          useWorkflowStore.getState().redo();
        } else {
          useWorkflowStore.getState().undo();
        }
        e.preventDefault();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'y') {
        useWorkflowStore.getState().redo();
        e.preventDefault();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'c') {
        await copyNodes();
        return;
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === 'v') {
        await pasteAtScreen(mousePosRef.current.x, mousePosRef.current.y);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reactFlowInstance, copyNodes, pasteAtScreen]);

  return mousePos;
}
