'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import localforage from 'localforage';
import { useWorkflowSync, type LocalWorkflowCache } from '@/features/workflow/hooks/use-workflow-sync';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { Node, Edge } from '@xyflow/react';

// Lazy-load the heavy canvas component
const WorkflowCanvas = dynamic(
  () => import('@/features/workflow/components/canvas/WorkflowCanvas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center animate-pulse">
        <span className="text-muted-foreground text-sm">初始化画布…</span>
      </div>
    ),
  }
);

interface Props {
  workflowId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}

function cacheKey(id: string) {
  return `workflow_cache_${id}`;
}

export default function WorkflowCanvasLoader({ workflowId, initialNodes, initialEdges }: Props) {
  const setCurrentWorkflow = useWorkflowStore((s) => s.setCurrentWorkflow);
  const hasInitializedRef = useRef(false);
  useWorkflowSync();

  // Inject data into Zustand Store on mount, preferring local dirty cache over SSR data
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    (async () => {
      const cached = await localforage.getItem<LocalWorkflowCache>(cacheKey(workflowId));

      // If local cache has unsaved changes with actual content, prefer it
      if (cached?.dirty && cached.nodes.length > 0) {
        setCurrentWorkflow(workflowId, cached.nodes, cached.edges);
      } else {
        setCurrentWorkflow(workflowId, initialNodes, initialEdges);
      }
    })();
  }, [workflowId]); // eslint-disable-line react-hooks/exhaustive-deps

  return <WorkflowCanvas />;
}
