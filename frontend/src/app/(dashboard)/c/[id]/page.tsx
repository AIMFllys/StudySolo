import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import WorkflowCanvasLoader from '@/app/(dashboard)/workspace/[id]/WorkflowCanvasLoader';
import WorkflowPageShell from '@/app/(dashboard)/workspace/[id]/WorkflowPageShell';
import { fetchWorkflowContentForServer } from '@/services/workflow.server.service';
import CanvasTraceLoader from '@/features/workflow/components/canvas/CanvasTraceLoader';
import { buildApiUrl, buildAuthHeaders } from '@/services/api-client';

interface Props {
  params: Promise<{ id: string }>;
}

// Reserved route segments that should not be treated as workflow IDs
const RESERVED_SEGMENTS = ['new', 'create', 'edit', 'settings'];

/** Check if current user is the workflow owner via lightweight API call. */
async function checkIsOwner(workflowId: string, token?: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/workflow/${workflowId}/public`), {
      headers: buildAuthHeaders(token),
      next: { revalidate: 0 },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.is_owner === true;
  } catch {
    return false;
  }
}

export default async function PrivateCanvasPage({ params }: Props) {
  const { id } = await params;

  // Guard: prevent reserved segments from being treated as workflow IDs
  // This protects against routing errors when users navigate to /c/new, /c/create, etc.
  if (RESERVED_SEGMENTS.includes(id.toLowerCase())) {
    redirect('/workspace');
  }

  const workflow = await fetchWorkflowContentForServer(id);

  if (!workflow) {
    notFound();
  }

  // Determine ownership for toolbar features
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;
  const isOwner = workflow.is_public
    ? await checkIsOwner(id, token)
    : true; // If not public, only owner can reach here (via check_workflow_access)

  return (
    <WorkflowPageShell
      workflowId={workflow.id}
      workflowName={workflow.name}
      isPublic={workflow.is_public}
      isOwner={isOwner}
    >
      <Suspense fallback={<CanvasTraceLoader />}>
        <WorkflowCanvasLoader
          key={workflow.id}
          workflowId={workflow.id}
          workflowName={workflow.name}
          initialNodes={workflow.nodes_json ?? []}
          initialEdges={workflow.edges_json ?? []}
        />
      </Suspense>
    </WorkflowPageShell>
  );
}
