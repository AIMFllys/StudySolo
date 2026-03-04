export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: string;
  status: string;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface PaginatedNoticeList {
  notices: NoticeItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type NoticeTypeFilter = 'all' | 'system' | 'feature' | 'maintenance' | 'promotion';
export type NoticeStatusFilter = 'all' | 'draft' | 'published' | 'archived';
