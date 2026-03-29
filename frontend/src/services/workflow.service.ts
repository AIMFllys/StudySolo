import { buildApiUrl, buildAuthHeaders, parseApiError } from '@/services/api-client';
import type {
  InteractionToggleResponse,
  WorkflowContent,
  WorkflowMeta,
  WorkflowPublicView,
} from '@/types/workflow';

/**
 * API error that preserves the HTTP status code.
 * Callers can check `err instanceof ApiError && err.status === 401`
 * to distinguish "not authenticated" from other failures.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Return the current Supabase access token (handles auto-refresh).
 * Returns undefined on the server side or if the user is not signed in.
 */
async function getAccessToken(): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Discriminated union for fetch operations that may fail silently.
 * Callers can distinguish "genuinely empty data" from "request failed".
 */
export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

/* ── List (my workflows) ────────────────────────────────────── */

export async function fetchWorkflowList(
  token?: string,
  revalidate = 30
): Promise<WorkflowMeta[]> {
  try {
    const response = await fetch(buildApiUrl('/api/workflow'), {
      headers: buildAuthHeaders(token),
      next: { revalidate },
    });

    if (!response.ok) {
      console.error('[fetchWorkflowList] HTTP', response.status);
      return [];
    }
    return (await response.json()) as WorkflowMeta[];
  } catch (e) {
    console.error('[fetchWorkflowList] network error:', e);
    return [];
  }
}

/* ── Content (canvas editing) ───────────────────────────────── */

export async function fetchWorkflowContent(
  workflowId: string,
  token?: string
): Promise<WorkflowContent | null> {
  try {
    const response = await fetch(
      buildApiUrl(`/api/workflow/${workflowId}/content`),
      {
        headers: buildAuthHeaders(token),
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new ApiError('Unauthorized', 401);
      }
      console.error('[fetchWorkflowContent] HTTP', response.status, 'for', workflowId);
      return null;
    }
    return (await response.json()) as WorkflowContent;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error('[fetchWorkflowContent] network error:', e);
    return null;
  }
}

/* ── Update workflow (name, description, tags, is_public) ──── */

export async function updateWorkflow(
  workflowId: string,
  payload: Partial<Pick<WorkflowMeta, 'name' | 'description' | 'tags' | 'is_public'>>
): Promise<WorkflowMeta> {
  const response = await fetch(`/api/workflow/${workflowId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, '更新工作流失败'));
  }
  return (await response.json()) as WorkflowMeta;
}

/** @deprecated Use updateWorkflow({ name }) instead */
export const renameWorkflow = (id: string, name: string) =>
  updateWorkflow(id, { name });

/* ── Delete ─────────────────────────────────────────────────── */

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const response = await fetch(`/api/workflow/${workflowId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await parseApiError(response, '删除工作流失败'));
  }
}

/* ── Social: Like / Favorite Toggle ─────────────────────────── */

export async function toggleLike(
  workflowId: string
): Promise<InteractionToggleResponse> {
  const token = await getAccessToken();
  const response = await fetch(`/api/workflow/${workflowId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response, '点赞操作失败'), response.status);
  }
  return (await response.json()) as InteractionToggleResponse;
}

export async function toggleFavorite(
  workflowId: string
): Promise<InteractionToggleResponse> {
  const token = await getAccessToken();
  const response = await fetch(`/api/workflow/${workflowId}/favorite`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response, '收藏操作失败'), response.status);
  }
  return (await response.json()) as InteractionToggleResponse;
}

/* ── Public view (no auth required, optionally personalized) ── */

export async function fetchPublicWorkflow(
  workflowId: string,
  token?: string
): Promise<WorkflowPublicView | null> {
  try {
    // Use Authorization header (instead of manual Cookie splice) for
    // consistency and to avoid potential Cookie header injection issues.
    const response = await fetch(buildApiUrl(`/api/workflow/${workflowId}/public`), {
      headers: buildAuthHeaders(token),
      next: { revalidate: 60 },
    });
    if (!response.ok) {
      if (response.status !== 404) {
        console.error('[fetchPublicWorkflow] HTTP', response.status, 'for', workflowId);
      }
      return null;
    }
    return (await response.json()) as WorkflowPublicView;
  } catch (e) {
    console.error('[fetchPublicWorkflow] network error:', e);
    return null;
  }
}

/* ── Marketplace ────────────────────────────────────────────── */

interface MarketplaceParams {
  filter?: 'official' | 'public' | 'featured';
  search?: string;
  tags?: string[];
  sort?: 'likes' | 'newest' | 'favorites';
  page?: number;
  limit?: number;
}

export async function fetchMarketplace(
  params: MarketplaceParams = {}
): Promise<FetchResult<WorkflowMeta[]>> {
  const qs = new URLSearchParams();
  if (params.filter) qs.set('filter', params.filter);
  if (params.search) qs.set('search', params.search);
  if (params.tags?.length) qs.set('tags', params.tags.join(','));
  if (params.sort) qs.set('sort', params.sort);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  try {
    const response = await fetch(
      buildApiUrl(`/api/workflow/marketplace?${qs.toString()}`),
      { cache: 'no-store' }
    );
    if (!response.ok) {
      const errMsg = await parseApiError(response, `HTTP ${response.status}`);
      return { ok: false, error: errMsg, status: response.status };
    }
    return { ok: true, data: (await response.json()) as WorkflowMeta[] };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '网络错误，请检查后端连接';
    return { ok: false, error: msg };
  }
}

/* ── Fork ───────────────────────────────────────────────────── */

export async function forkWorkflow(
  workflowId: string
): Promise<WorkflowMeta> {
  const token = await getAccessToken();
  const response = await fetch(`/api/workflow/${workflowId}/fork`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(await parseApiError(response, 'Fork 工作流失败'), response.status);
  }
  return (await response.json()) as WorkflowMeta;
}
