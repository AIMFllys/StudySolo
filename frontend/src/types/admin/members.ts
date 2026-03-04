export interface TierStats {
  free: number;
  pro: number;
  pro_plus: number;
  ultra: number;
  total: number;
  paid_total: number;
}

export interface MemberItem {
  user_id: string;
  email: string | null;
  tier: string;
  subscription_status: string | null;
  subscription_start: string | null;
  subscription_end: string | null;
}

export interface PaginatedMemberList {
  members: MemberItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RevenueStats {
  active_subscriptions: number;
  mrr: number;
  arr: number;
  arpu: number;
}

export type MemberTierFilter = 'pro' | 'pro_plus' | 'ultra' | '';
