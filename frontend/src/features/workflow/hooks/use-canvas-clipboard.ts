import { useCallback } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

/**
 * Paste nodes from clipboard at a given screen position.
 * Shared by both right-click menu paste and Ctrl+V shortcut.
 */
function pasteNodesAtPosition(
  reactFlowInstance: ReactFlowInstance,
  screenX: number,
  screenY: number,
  parsedData: { source: string; nodes: Node[] },
) {
  const store = useWorkflowStore.getState();
  store.takeSnapshot();

  const flowPos = reactFlowInstance.screenToFlowPosition({ x: screenX, y: screenY });

  let minX = Infinity;
  let minY = Infinity;
  parsedData.nodes.forEach((n: Node) => {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.y < minY) minY = n.position.y;
  });

  const newNodes = parsedData.nodes.map((n: Node) => {
    const newId = `${n.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    return {
      ...n,
      id: newId,
      selected: true,
      position: {
        x: flowPos.x + (n.position.x - minX),
        y: flowPos.y + (n.position.y - minY),
      },
    };
  });

  const currentNodes = store.nodes.map((n) => ({ ...n, selected: false }));
  store.setNodes([...currentNodes, ...newNodes]);
}

function tryParseCanvasClipboard(text: string): { source: string; nodes: Node[] } | null {
  try {
    const data = JSON.parse(text);
    if (data && data.source === 'studysolo-canvas' && Array.isArray(data.nodes)) {
      return data as { source: string; nodes: Node[] };
    }
  } catch {
    // not valid canvas clipboard data
  }
  return null;
}

export function useCanvasClipboard(reactFlowInstance: ReactFlowInstance) {
  const copyNodes = useCallback(async (nodeId?: string) => {
    const targetNodes = nodeId
      ? useWorkflowStore.getState().nodes.filter((n) => n.id === nodeId)
      : useWorkflowStore.getState().nodes.filter((n) => n.selected);
    if (targetNodes.length > 0) {
      const payload = JSON.stringify({ source: 'studysolo-canvas', nodes: targetNodes });
      try {
        await navigator.clipboard.writeText(payload);
      } catch (err) {
        console.warn('Failed to copy to clipboard', err);
      }
    }
  }, []);

  const pasteAtScreen = useCallback(
    async (screenX: number, screenY: number) => {
      try {
        const text = await navigator.clipboard.readText();
        const data = tryParseCanvasClipboard(text);
        if (data) {
          pasteNodesAtPosition(reactFlowInstance, screenX, screenY, data);
        }
      } catch (err) {
        console.warn('Failed to paste from clipboard or invalid format', err);
      }
    },
    [reactFlowInstance],
  );

  const deleteNode = useCallback((nodeId: string) => {
    const store = useWorkflowStore.getState();
    store.takeSnapshot();
    store.setNodes(store.nodes.filter((n) => n.id !== nodeId));
  }, []);

  return { copyNodes, pasteAtScreen, deleteNode };
}
