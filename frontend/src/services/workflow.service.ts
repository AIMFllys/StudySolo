import type { WorkflowContent, WorkflowMeta } from '@/types/workflow';

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:2038'
  );
}

function buildHeaders(token?: string) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'Content-Type': 'application/json',
  };
}

async function parseError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail ?? fallback;
  } catch {
    return fallback;
  }
}

export async function fetchWorkflowList(
  token?: string,
  revalidate = 30
): Promise<WorkflowMeta[]> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/workflow`, {
      headers: buildHeaders(token),
      next: { revalidate },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WorkflowMeta[];
    return data.map(
      ({ id, name, description, status, created_at, updated_at }) => ({
        id,
        name,
        description,
        status,
        created_at,
        updated_at,
      })
    );
  } catch {
    return [];
  }
}

export async function fetchWorkflowContent(
  workflowId: string,
  token?: string
): Promise<WorkflowContent | null> {
  try {
    const response = await fetch(
      `${getApiBaseUrl()}/api/workflow/${workflowId}/content`,
      {
        headers: buildHeaders(token),
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as WorkflowContent;
  } catch {
    return null;
  }
}

export async function renameWorkflow(
  workflowId: string,
  name: string
): Promise<WorkflowMeta> {
  const response = await fetch(`/api/workflow/${workflowId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, '重命名工作流失败'));
  }

  return (await response.json()) as WorkflowMeta;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const response = await fetch(`/api/workflow/${workflowId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await parseError(response, '删除工作流失败'));
  }
}
