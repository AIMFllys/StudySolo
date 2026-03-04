'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin.service';
import type { PaginatedRatingList, RatingOverview, RatingTypeFilter } from '@/types/admin';
import { AdminRatingsTable } from './AdminRatingsTable';

export function AdminRatingsPageView() {
  const [overview, setOverview] = useState<RatingOverview | null>(null);
  const [ratingList, setRatingList] = useState<PaginatedRatingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<RatingTypeFilter>('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = typeFilter ? `&rating_type=${typeFilter}` : '';
      const [ov, list] = await Promise.all([
        adminFetch<RatingOverview>('/ratings/overview'),
        adminFetch<PaginatedRatingList>(
          `/ratings/details?page=${page}&page_size=20${typeParam}`
        ),
      ]);
      setOverview(ov);
      setRatingList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Ratings & Feedback</h1>
        <p className="mt-0.5 text-sm text-white/40">
          {overview ? `${overview.nps_count + overview.csat_count} total ratings` : 'Loading...'}
        </p>
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => void fetchAll()} className="ml-4 text-xs text-red-300 underline hover:text-red-200">
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-xs uppercase tracking-wider text-white/40">NPS Score</p>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          ) : overview ? (
            <>
              <p
                className={`text-3xl font-bold ${
                  overview.nps_score === null
                    ? 'text-white/30'
                    : overview.nps_score >= 50
                      ? 'text-emerald-300'
                      : overview.nps_score >= 0
                        ? 'text-yellow-300'
                        : 'text-red-300'
                }`}
              >
                {overview.nps_score !== null ? overview.nps_score.toFixed(1) : '—'}
              </p>
              <p className="mt-1 text-xs text-white/40">
                {overview.nps_count} responses · avg {overview.nps_avg?.toFixed(1) ?? '—'}/10
              </p>
            </>
          ) : null}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-xs uppercase tracking-wider text-white/40">CSAT Score</p>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-white/10" />
          ) : overview ? (
            <>
              <p
                className={`text-3xl font-bold ${
                  overview.csat_avg === null
                    ? 'text-white/30'
                    : overview.csat_avg >= 4
                      ? 'text-emerald-300'
                      : overview.csat_avg >= 3
                        ? 'text-yellow-300'
                        : 'text-red-300'
                }`}
              >
                {overview.csat_avg !== null ? overview.csat_avg.toFixed(2) : '—'}
              </p>
              <p className="mt-1 text-xs text-white/40">{overview.csat_count} responses · out of 5</p>
            </>
          ) : null}
        </div>
      </div>

      <AdminRatingsTable
        loading={loading}
        ratingList={ratingList}
        page={page}
        typeFilter={typeFilter}
        onFilterChange={(filter) => {
          setTypeFilter(filter);
          setPage(1);
        }}
        onPrevPage={() => setPage((current) => Math.max(1, current - 1))}
        onNextPage={() => {
          if (!ratingList) return;
          setPage((current) => Math.min(ratingList.total_pages, current + 1));
        }}
      />
    </div>
  );
}
