import { authedFetch, parseApiError } from '@/services/api-client';
import {
  DEFAULT_MODEL,
  FALLBACK_AI_MODEL_OPTIONS,
  mapCatalogSkuToOption,
  type AIModelOption,
} from '@/features/workflow/constants/ai-models';
import type { AdminCatalogResponse, AdminCatalogUpdateRequest, AdminCatalogUpdateResponse, UserCatalogResponse } from '@/types/ai-catalog';
import { adminFetch } from '@/services/admin.service';

export async function getUserAiModelCatalog(): Promise<AIModelOption[]> {
  const response = await authedFetch('/api/ai/models/catalog');
  if (!response.ok) {
    throw new Error(await parseApiError(response, '加载 AI 模型目录失败'));
  }
  const data = await response.json() as UserCatalogResponse;
  const items = (data.items ?? []).map(mapCatalogSkuToOption);
  return items.length > 0 ? items : FALLBACK_AI_MODEL_OPTIONS;
}

export async function getAdminAiModelCatalog() {
  const data = await adminFetch<AdminCatalogResponse>('/models/catalog');
  return data.items ?? [];
}

export async function updateAdminAiModelCatalogItem(skuId: string, payload: AdminCatalogUpdateRequest) {
  return adminFetch<AdminCatalogUpdateResponse>(`/models/${skuId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function getDefaultAiModel(options: AIModelOption[]): AIModelOption {
  return options[0] ?? DEFAULT_MODEL;
}
