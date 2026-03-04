'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin.service';
import type {
  MemberTierFilter as TierFilter,
  PaginatedMemberList,
  RevenueStats,
  TierStats,
} from '@/types/admin';

const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
  ultra: 'Ultra',
};

const TIER_COLORS: Record<string, string> = {
  free: 'bg-white/10 text-white/50',
  pro: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  pro_plus: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
  ultra: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

function maskEmail(email: string | null): string {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub ? <p className="text-white/40 text-xs mt-0.5">{sub}</p> : null}
    </div>
  );
}

export function AdminMembersPageView() {
  const [tierStats, setTierStats] = useState<TierStats | null>(null);
  const [memberList, setMemberList] = useState<PaginatedMemberList | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<TierFilter>('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tierParam = tierFilter ? `&tier=${tierFilter}` : '';
      const [stats, list, rev] = await Promise.all([
        adminFetch<TierStats>('/members/stats'),
        adminFetch<PaginatedMemberList>(`/members/list?page=${page}&page_size=20${tierParam}`),
        adminFetch<RevenueStats>('/members/revenue'),
      ]);
      setTierStats(stats);
      setMemberList(list);
      setRevenue(rev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load member data');
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-xl font-bold">Member Management</h1>
        <p className="text-white/40 text-sm mt-0.5">
          {tierStats ? `${tierStats.total.toLocaleString()} total users · ${tierStats.paid_total.toLocaleString()} paid` : 'Loading...'}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void fetchAll()} className="text-red-300 hover:text-red-200 underline text-xs ml-4">
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 h-20 animate-pulse" />
          ))
        ) : tierStats ? (
          <>
            <KpiCard label="Free" value={tierStats.free.toLocaleString()} />
            <KpiCard label="Pro" value={tierStats.pro.toLocaleString()} />
            <KpiCard label="Pro+" value={tierStats.pro_plus.toLocaleString()} />
            <KpiCard label="Ultra" value={tierStats.ultra.toLocaleString()} />
          </>
        ) : null}
      </div>

      {revenue ? (
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="MRR" value={`$${revenue.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <KpiCard label="ARR" value={`$${revenue.arr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <KpiCard
            label="ARPU"
            value={`$${revenue.arpu.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${revenue.active_subscriptions} active subs`}
          />
        </div>
      ) : null}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">Paid Members</h2>
          <div className="flex items-center gap-1">
            {(['', 'pro', 'pro_plus', 'ultra'] as TierFilter[]).map((tier) => (
              <button
                key={tier || 'all'}
                onClick={() => {
                  setTierFilter(tier);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  tierFilter === tier ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white bg-white/5'
                }`}
              >
                {tier ? TIER_LABELS[tier] : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Email', 'Tier', 'Sub Status', 'Sub Start', 'Sub End'].map((header) => (
                  <th key={header} className="px-4 py-2.5 text-left text-white/40 text-xs uppercase tracking-wider font-medium">
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
                        <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (memberList?.members.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    No paid members found
                  </td>
                </tr>
              ) : (
                memberList?.members.map((member) => (
                  <tr key={member.user_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/70 text-xs">{maskEmail(member.email)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${TIER_COLORS[member.tier] ?? TIER_COLORS.free}`}>
                        {TIER_LABELS[member.tier] ?? member.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{member.subscription_status ?? '—'}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDate(member.subscription_start)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDate(member.subscription_end)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {memberList && memberList.total_pages > 1 ? (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-white/40 text-xs">
              Page {memberList.page} of {memberList.total_pages} · {memberList.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md text-xs bg-white/5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage((current) => Math.min(memberList.total_pages, current + 1))}
                disabled={page === memberList.total_pages}
                className="px-3 py-1 rounded-md text-xs bg-white/5 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
