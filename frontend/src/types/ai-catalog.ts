import type { TierType } from '@/services/auth.service';

export type BillingChannel = 'native' | 'proxy' | 'tool_service';
export type RoutingPolicy = 'native_first' | 'proxy_first' | 'capability_fixed';

export interface CatalogSku {
  sku_id: string;
  family_id: string;
  family_name: string;
  provider: string;
  vendor: string;
  model_id: string;
  display_name: string;
  billing_channel: BillingChannel;
  task_family: string;
  routing_policy: RoutingPolicy;
  required_tier: TierType;
  is_enabled: boolean;
  is_visible: boolean;
  is_user_selectable: boolean;
  is_fallback_only: boolean;
  supports_thinking: boolean;
  max_context_tokens: number | null;
  input_price_cny_per_million: number;
  output_price_cny_per_million: number;
  price_source: string | null;
  pricing_verified_at: string | null;
  sort_order: number;
}

export interface UserCatalogResponse {
  items: CatalogSku[];
}

export interface AdminCatalogResponse {
  items: CatalogSku[];
}

export interface AdminCatalogUpdateRequest {
  display_name?: string;
  required_tier?: TierType;
  is_enabled?: boolean;
  is_visible?: boolean;
  is_user_selectable?: boolean;
  is_fallback_only?: boolean;
  price_source?: string;
  input_price_cny_per_million?: number;
  output_price_cny_per_million?: number;
  sort_order?: number;
}

export interface AdminCatalogUpdateResponse {
  success: boolean;
  sku_id: string;
}
