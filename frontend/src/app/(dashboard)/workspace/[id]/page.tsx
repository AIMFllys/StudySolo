import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import WorkflowCanvasLoader from './WorkflowCanvasLoader';
import RunButton from '@/features/workflow/components/toolbar/RunButton';
import WorkflowPromptInput from '@/features/workflow/components/panel/WorkflowPromptInput';
import { fetchWorkflowContentForServer } from '@/services/workflow.server.service';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkflowPage({ params }: Props) {
  const { id } = await params;
  const workflow = await fetchWorkflowContentForServer(id);

  if (!workflow) {
    notFound();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <h1 className="truncate text-sm font-medium">{workflow.name}</h1>
          <RunButton />
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <Suspense fallback={<CanvasSkeleton />}>
          <WorkflowCanvasLoader
            workflowId={workflow.id}
            initialNodes={workflow.nodes_json ?? []}
            initialEdges={workflow.edges_json ?? []}
          />
        </Suspense>
      </div>

      <WorkflowPromptInput />
    </div>
  );
}

function CanvasSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted/20 animate-pulse">
      <span className="text-sm text-muted-foreground">加载画布中...</span>
    </div>
  );
}
