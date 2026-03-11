'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import localforage from 'localforage';
import { useWorkflowSync } from '@/hooks/use-workflow-sync';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { Node, Edge } from '@xyflow/react';

// Lazy-load the heavy canvas component
const WorkflowCanvas = dynamic(
  () => import('@/components/business/workflow/WorkflowCanvas'),
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

interface LocalWorkflowCache {
  workflow_id: string;
  nodes: Node[];
  edges: Edge[];
  dirty: boolean;
  local_updated_at: string;
  cloud_updated_at: string;
}

function cacheKey(id: string) {
  return `workflow_cache_${id}`;
}

export default function WorkflowCanvasLoader({ workflowId, initialNodes, initialEdges }: Props) {
  const setCurrentWorkflow = useWorkflowStore((s) => s.setCurrentWorkflow);
  const { forceSave } = useWorkflowSync();
  const forceSaveRef = useRef(forceSave);

  // Prefer local cache for better continuity when navigating away and back quickly.
  useEffect(() => {
    let cancelled = false;

    const hydrateWorkflow = async () => {
      const cached = await localforage.getItem<LocalWorkflowCache>(cacheKey(workflowId));
      if (cancelled) return;

      if (
        cached &&
        cached.workflow_id === workflowId &&
        Array.isArray(cached.nodes) &&
        Array.isArray(cached.edges)
      ) {
        const localTs = Date.parse(cached.local_updated_at || '');
        const cloudTs = Date.parse(cached.cloud_updated_at || '');
        if (Number.isFinite(localTs) && Number.isFinite(cloudTs) && localTs >= cloudTs) {
          setCurrentWorkflow(workflowId, cached.nodes, cached.edges);
          return;
        }
      }

      setCurrentWorkflow(workflowId, initialNodes, initialEdges);
    };

    void hydrateWorkflow();
    return () => {
      cancelled = true;
    };
  }, [workflowId, initialNodes, initialEdges, setCurrentWorkflow]);

  useEffect(() => {
    forceSaveRef.current = forceSave;
  }, [forceSave]);

  // Flush pending changes when leaving current workflow page.
  useEffect(() => {
    return () => {
      void forceSaveRef.current();
    };
  }, []);

  return <WorkflowCanvas />;
}
