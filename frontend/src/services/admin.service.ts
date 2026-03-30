import { credentialsFetch } from '@/services/api-client';
import type {
  ConfigListResponse,
  DashboardCharts,
  DashboardOverview,
  DashboardTimeRange,
  PaginatedAuditLogs,
  PaginatedUserList,
  UserDetailResponse,
} from '@/types/admin';
import type {
  AdminCatalogResponse,
  AdminCatalogUpdateRequest,
  AdminCatalogUpdateResponse,
} from '@/types/ai-catalog';
import type {
  AdminUsageRange,
  CostSplitResponse,
  ModelBreakdownResponse,
  RecentCallsResponse,
  UsageLiveResponse,
  UsageOverviewResponse,
  UsageSourceFilter,
  UsageTimeseriesResponse,
  UsageWindow,
} from '@/types/usage';

const ADMIN_API_BASE = '/api/admin';

export interface AdminProfile {
  id: string;
  username: string;
  force_change_password: boolean;
}

/** Typed error that preserves the full API error body */
export class AdminApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
  ) {
    super((body.detail as string) || (body.error as string) || `HTTP ${status}`);
    this.name = 'AdminApiError';
  }
}

export async function adminFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await credentialsFetch(`${ADMIN_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin-analysis/login';
    }
    throw new AdminApiError(401, { error: 'Unauthorized' });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new AdminApiError(response.status, body);
  }

  return response.json();
}

export const adminLogin = (username: string, password: string) =>
  adminFetch<{ success: boolean; admin: AdminProfile }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const adminLogout = () =>
  adminFetch<{ message: string }>('/logout', { method: 'POST' });

export const adminChangePassword = (currentPassword: string, newPassword: string) =>
  adminFetch<{ message: string }>('/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });

export const getDashboardOverview = () => adminFetch<DashboardOverview>('/dashboard/overview');

export const getDashboardCharts = (timeRange: DashboardTimeRange) =>
  adminFetch<DashboardCharts>(`/dashboard/charts?time_range=${timeRange}`);

export const getAdminAiOverview = (range: AdminUsageRange = '24h') =>
  adminFetch<UsageOverviewResponse>(`/dashboard/ai-overview?range=${range}`);

export const getAdminAiLive = (window: UsageWindow = '5m') =>
  adminFetch<UsageLiveResponse>(`/dashboard/ai-live?window=${window}`);

export const getAdminAiTimeseries = (range: AdminUsageRange = '7d', source: UsageSourceFilter = 'all') =>
  adminFetch<UsageTimeseriesResponse>(`/dashboard/ai-timeseries?range=${range}&source=${source}`);

export const getAdminAiModelBreakdown = (range: AdminUsageRange = '7d', source: UsageSourceFilter = 'all') =>
  adminFetch<ModelBreakdownResponse>(`/dashboard/ai-model-breakdown?range=${range}&source=${source}`);

export const getAdminAiRecentCalls = (page = 1, pageSize = 10) =>
  adminFetch<RecentCallsResponse>(`/dashboard/ai-recent-calls?page=${page}&page_size=${pageSize}`);

export const getAdminAiCostSplit = (range: AdminUsageRange = '7d') =>
  adminFetch<CostSplitResponse>(`/dashboard/ai-cost-split?range=${range}`);

export const getAdminModelCatalog = () =>
  adminFetch<AdminCatalogResponse>('/models/catalog');

export const updateAdminModelCatalogItem = (skuId: string, payload: AdminCatalogUpdateRequest) =>
  adminFetch<AdminCatalogUpdateResponse>(`/models/${skuId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

export const getUsers = (params: URLSearchParams) =>
  adminFetch<PaginatedUserList>(`/users?${params.toString()}`);

export const getUserDetail = (userId: string) =>
  adminFetch<UserDetailResponse>(`/users/${userId}`);

export const updateUserStatus = (userId: string, isActive: boolean) =>
  adminFetch<{ success: boolean; user_id: string; is_active: boolean }>(`/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });

export const updateUserRole = (userId: string, tier: string) =>
  adminFetch<{ success: boolean; user_id: string; tier: string }>(`/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ tier }),
  });

export const getConfigs = () => adminFetch<ConfigListResponse>('/config');

export const updateConfig = (key: string, value: unknown, description?: string | null) =>
  adminFetch<{ success: boolean; key: string }>('/config', {
    method: 'PUT',
    body: JSON.stringify({ key, value, description }),
  });

export const getAuditLogs = (params: URLSearchParams) =>
  adminFetch<PaginatedAuditLogs>(`/audit-logs?${params.toString()}`);
