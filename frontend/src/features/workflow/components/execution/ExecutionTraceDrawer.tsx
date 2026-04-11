'use client';

import { useMemo } from 'react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';
import { useNodeManifest } from '@/features/workflow/hooks/use-node-manifest';
import { ExecutionProgressHeader } from '@/features/workflow/components/execution/ExecutionProgressHeader';
import { ExecutionTraceList } from '@/features/workflow/components/execution/ExecutionTraceList';
import { buildExecutionNodeNameMap } from '@/features/workflow/utils/execution-node-copy';
import type { NodeManifestItem } from '@/types';

function buildManifestLookup(manifest: NodeManifestItem[]) {
  return manifest.reduce<Record<string, NodeManifestItem>>((lookup, item) => {
    lookup[item.type] = item;
    return lookup;
  }, {});
}

export default function ExecutionTraceDrawer() {
  const executionSession = useWorkflowStore((state) => state.executionSession);
  const clearExecutionSession = useWorkflowStore((state) => state.clearExecutionSession);
  const nodes = useWorkflowStore((state) => state.nodes);
  const { manifest } = useNodeManifest();
  const manifestByType = useMemo(() => buildManifestLookup(manifest), [manifest]);

  const nodeNameMap = useMemo(
    () => buildExecutionNodeNameMap(nodes, manifestByType),
    [manifestByType, nodes],
  );

  if (!executionSession) {
    return null;
  }

  return (
    <aside className="fixed right-0 top-0 z-50 flex h-screen w-[420px] max-w-[90vw] animate-in slide-in-from-right-6 fade-in-0 flex-col border-l border-black/10 bg-background/95 shadow-2xl duration-200 backdrop-blur-md dark:border-white/10">
      <ExecutionProgressHeader session={executionSession} onClose={clearExecutionSession} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ExecutionTraceList session={executionSession} nodeNameMap={nodeNameMap} />
      </div>
    </aside>
  );
}
