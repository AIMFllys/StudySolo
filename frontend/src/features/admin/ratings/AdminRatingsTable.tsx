import type { PaginatedRatingList, RatingTypeFilter } from '@/types/admin';
import { formatDate } from '@/features/admin/shared';

function npsCategory(score: number): { label: string; color: string } {
  if (score >= 9) return { label: 'Promoter', color: 'text-emerald-300' };
  if (score >= 7) return { label: 'Passive', color: 'text-yellow-300' };
  return { label: 'Detractor', color: 'text-red-300' };
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-4 text-right text-xs text-white/60">{score}</span>
    </div>
  );
}

interface AdminRatingsTableProps {
  loading: boolean;
  ratingList: PaginatedRatingList | null;
  page: number;
  typeFilter: RatingTypeFilter;
  onFilterChange: (value: RatingTypeFilter) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function AdminRatingsTable({
  loading,
  ratingList,
  page,
  typeFilter,
  onFilterChange,
  onPrevPage,
  onNextPage,
}: AdminRatingsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-white">Rating Details</h2>
        <div className="flex items-center gap-1">
          {(['', 'nps', 'csat'] as RatingTypeFilter[]).map((filter) => (
            <button
              key={filter || 'all'}
              onClick={() => onFilterChange(filter)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                typeFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {filter ? filter.toUpperCase() : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Type', 'Score', 'Category', 'Comment', 'Date'].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, row) => (
                <tr key={row} className="border-b border-white/5">
                  {Array.from({ length: 5 }).map((_, col) => (
                    <td key={col} className="px-4 py-3">
                      <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !ratingList || ratingList.ratings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-white/30">
                  No ratings found
                </td>
              </tr>
            ) : (
              ratingList.ratings.map((rating) => {
                const category = rating.rating_type === 'nps' ? npsCategory(rating.score) : null;

                return (
                  <tr key={rating.id} className="border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
                          rating.rating_type === 'nps'
                            ? 'border-blue-500/30 bg-blue-500/20 text-blue-300'
                            : 'border-purple-500/30 bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {rating.rating_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBar score={rating.score} max={rating.rating_type === 'nps' ? 10 : 5} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {category ? (
                        <span className={category.color}>{category.label}</span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs text-white/50">{rating.comment ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {formatDate(rating.created_at, 'en-US')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {ratingList && ratingList.total_pages > 1 ? (
        <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
          <p className="text-xs text-white/40">
            Page {ratingList.page} of {ratingList.total_pages} · {ratingList.total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrevPage}
              disabled={page === 1}
              className="rounded-md bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Prev
            </button>
            <button
              onClick={onNextPage}
              disabled={page === ratingList.total_pages}
              className="rounded-md bg-white/5 px-3 py-1 text-xs text-white/50 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
