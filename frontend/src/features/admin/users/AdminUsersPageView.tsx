'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/services/admin.service';
import type { PaginatedUserList, StatusFilter, TierFilter } from '@/types/admin';
import {
  PageHeader,
  Pagination,
  TableSkeletonRows,
  buildPaginationParams,
  formatDate,
  maskEmail,
} from '@/features/admin/shared';
import { StatusBadgeWithDot, TierBadge } from './user-shared';

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'pro_plus', label: 'Pro+' },
  { value: 'ultra', label: 'Ultra' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delayMs]);

  return debounced;
}

export function AdminUsersPageView() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setPage(1);
  }, [tierFilter, statusFilter, debouncedSearch]);

  const queryString = useMemo(() => {
    const params = buildPaginationParams(page, 20);
    if (debouncedSearch) {
      params.set('search', debouncedSearch);
    }
    if (tierFilter !== 'all') {
      params.set('tier', tierFilter);
    }
    if (statusFilter !== 'all') {
      params.set('is_active', statusFilter === 'active' ? 'true' : 'false');
    }
    return params.toString();
  }, [debouncedSearch, page, statusFilter, tierFilter]);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<PaginatedUserList>(`/users?${queryString}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={data ? `${data.total.toLocaleString()} users total` : 'Loading users...'}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white text-sm placeholder-white/25 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition"
          />
        </div>

        <select
          value={tierFilter}
          onChange={(event) => setTierFilter(event.target.value as TierFilter)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition cursor-pointer"
        >
          {TIER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0F172A]">
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition cursor-pointer"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0F172A]">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void fetchUsers()} className="text-red-300 hover:text-red-200 underline text-xs ml-4">
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Created</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-left text-white/50 font-medium text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={8} cols={6} />
              ) : !error && (data?.users.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin-analysis/users/${user.id}`)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3 text-white/80 group-hover:text-white transition-colors font-mono text-xs">
                      {maskEmail(user.email)}
                    </td>
                    <td className="px-4 py-3">
                      <TierBadge tier={user.tier} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadgeWithDot isActive={user.is_active} />
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDate(user.last_login)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          router.push(`/admin-analysis/users/${user.id}`);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium transition-colors"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={data?.total_pages ?? 1}
          total={data?.total}
          loading={loading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
