'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/services/admin.service';
import type {
  NoticeStatusFilter,
  NoticeTypeFilter,
  PaginatedNoticeList,
} from '@/types/admin';
import {
  PageHeader,
  buildPaginationParams,
} from '@/features/admin/shared';
import { AdminNoticesTable } from './AdminNoticesTable';

const TYPE_OPTIONS: { value: NoticeTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'system', label: 'System' },
  { value: 'feature', label: 'Feature' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'promotion', label: 'Promotion' },
];

const STATUS_OPTIONS: { value: NoticeStatusFilter; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export function AdminNoticesPageView() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedNoticeList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<NoticeTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<NoticeStatusFilter>('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  const queryString = useMemo(() => {
    const params = buildPaginationParams(page, 20);
    if (typeFilter !== 'all') params.set('type', typeFilter);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    return params.toString();
  }, [page, statusFilter, typeFilter]);

  async function fetchNotices() {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<PaginatedNoticeList>(`/notices?${queryString}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notices');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  async function handlePublish(noticeId: string) {
    setActionLoading(noticeId);
    try {
      await adminFetch(`/notices/${noticeId}/publish`, { method: 'POST' });
      await fetchNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish notice');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(noticeId: string, title: string) {
    const confirmed = window.confirm(`Delete notice "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    setActionLoading(noticeId);
    try {
      await adminFetch(`/notices/${noticeId}`, { method: 'DELETE' });
      await fetchNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notice');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notice Management"
        description={data ? `${data.total.toLocaleString()} notices total` : 'Loading notices...'}
        action={
          <button
            onClick={() => router.push('/admin-analysis/notices/create')}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Notice
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as NoticeTypeFilter)}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0F172A]">
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as NoticeStatusFilter)}
          className="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#0F172A]">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => void fetchNotices()} className="ml-4 text-xs text-red-300 underline hover:text-red-200">
            Retry
          </button>
        </div>
      ) : null}

      <AdminNoticesTable
        data={data}
        loading={loading}
        page={page}
        actionLoading={actionLoading}
        onPageChange={setPage}
        onPublish={(id) => {
          void handlePublish(id);
        }}
        onDelete={(id, title) => {
          void handleDelete(id, title);
        }}
      />
    </div>
  );
}
