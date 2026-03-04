export interface RatingOverview {
  nps_count: number;
  nps_avg: number | null;
  nps_score: number | null;
  csat_count: number;
  csat_avg: number | null;
}

export interface RatingItem {
  id: string;
  user_id: string;
  email: string | null;
  rating_type: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface PaginatedRatingList {
  ratings: RatingItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type RatingTypeFilter = 'nps' | 'csat' | '';
