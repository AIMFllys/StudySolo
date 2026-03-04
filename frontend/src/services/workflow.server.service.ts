import { cookies } from 'next/headers';
import {
  fetchWorkflowContent,
  fetchWorkflowList,
} from '@/services/workflow.service';
import type { WorkflowContent, WorkflowMeta } from '@/types/workflow';

async function getAccessTokenFromCookieStore() {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

export async function fetchWorkflowListForServer(): Promise<WorkflowMeta[]> {
  const token = await getAccessTokenFromCookieStore();
  return fetchWorkflowList(token, 30);
}

export async function fetchWorkflowContentForServer(
  workflowId: string
): Promise<WorkflowContent | null> {
  const token = await getAccessTokenFromCookieStore();
  return fetchWorkflowContent(workflowId, token);
}
