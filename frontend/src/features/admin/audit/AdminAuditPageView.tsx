'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin.service';
import type { PaginatedAuditLogs } from '@/types/admin';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  logout: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  config_update: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  model_config_update: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  user_status_update: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  user_role_update: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};

function ActionBadge({ action }: { action: string }) {
  const colorClass = ACTION_COLORS[action] ?? 'bg-white/10 text-white/50 border-white/20';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${colorClass}`}>{action}</span>;
}

export function AdminAuditPageView() {
  const [data, setData] = useState<PaginatedAuditLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const actionParam = actionFilter ? `&action=${encodeURIComponent(actionFilter)}` : '';
      const result = await adminFetch<PaginatedAuditLogs>(`/audit-logs?page=${page}&page_size=20${actionParam}`);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">Audit Logs</h1>
          <p className="text-white/40 text-sm mt-0.5">{data ? `${data.total.toLocaleString()} total entries` : 'Loading...'}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by action..."
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setPage(1);
            }}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-indigo-500 w-44"
          />
          <button
            onClick={() => void fetchLogs()}
            className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void fetchLogs()} className="text-red-300 hover:text-red-200 underline text-xs ml-4">
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Time', 'Action', 'Target', 'IP', 'Details'].map((header) => (
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
              ) : (data?.logs.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                data?.logs.flatMap((log) => {
                  const row = (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 text-white/50 text-xs whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">
                        {log.target_type ? <span className="text-white/30">{log.target_type}: </span> : null}
                        {log.target_id ? (
                          <span className="font-mono">{log.target_id.slice(0, 16)}{log.target_id.length > 16 ? '…' : ''}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs font-mono">{log.ip_address ?? '—'}</td>
                      <td className="px-4 py-3 text-white/40 text-xs">{log.details ? (expandedId === log.id ? '▼ hide' : '▶ show') : '—'}</td>
                    </tr>
                  );

                  if (expandedId === log.id && log.details) {
                    const detailRow = (
                      <tr key={`${log.id}-detail`} className="border-b border-white/5 bg-white/3">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-white/50 text-xs font-mono whitespace-pre-wrap break-all">{JSON.stringify(log.details, null, 2)}</pre>
                        </td>
                      </tr>
                    );

                    return [row, detailRow];
                  }

                  return [row];
                })
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 ? (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <p className="text-white/40 text-xs">
              Page {data.page} of {data.total_pages} · {data.total} total
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
                onClick={() => setPage((current) => Math.min(data.total_pages, current + 1))}
                disabled={page === data.total_pages}
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
