/**
 * SSE Streaming Proxy for Workflow Execution — Next.js App Router API Route.
 *
 * App Router route files take priority over rewrites, so this file intercepts
 * /api/workflow/{id}/execute while everything else continues through rewrites.
 */

import { proxySseRequest } from '@/app/api/_lib/sse-proxy';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ workflowId: string }> },
) {
  const { workflowId } = await params;
  return proxySseRequest(req, `/api/workflow/${workflowId}/execute`);
}
