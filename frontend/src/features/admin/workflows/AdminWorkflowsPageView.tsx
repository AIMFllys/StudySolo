'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/services/admin.service';
import type {
  ErrorWorkflowsResponse,
  RunningWorkflowsResponse,
  WorkflowStatsResponse,
  WorkflowTimeRange,
} from '@/types/admin';
import { KpiCard, PageHeader, TableSkeletonRows, formatDuration, formatDateTime, truncateId } from '@/features/admin/shared';

export function AdminWorkflowsPageView() {
  const [timeRange, setTimeRange] = useState<WorkflowTimeRange>('7d');
  const [statsData, setStatsData] = useState<WorkflowStatsResponse | null>(null);
  const [runningData, setRunningData] = useState<RunningWorkflowsResponse | null>(null);
  const [errorsData, setErrorsData] = useState<ErrorWorkflowsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, running, errors] = await Promise.all([
        adminFetch<WorkflowStatsResponse>(`/workflows/stats?time_range=${timeRange}`),
        adminFetch<RunningWorkflowsResponse>('/workflows/running'),
        adminFetch<ErrorWorkflowsResponse>('/workflows/errors'),
      ]);
      setStatsData(stats);
      setRunningData(running);
      setErrorsData(errors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflow metrics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const stats = statsData?.stats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Monitoring"
        description={runningData ? `${runningData.total} running now` : 'Loading workflows...'}
        action={
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            {(['7d', '30d', '90d'] as WorkflowTimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === range ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      />

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
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 h-20 animate-pulse" />
          ))
        ) : stats ? (
          <>
            <KpiCard label="Total Runs" value={stats.total_runs.toLocaleString()} sub={timeRange} />
            <KpiCard label="Success Rate" value={`${(stats.success_rate * 100).toFixed(1)}%`} sub={`${stats.completed} completed`} />
            <KpiCard label="Avg Duration" value={formatDuration(stats.avg_duration_seconds)} sub="completed runs" />
            <KpiCard label="Tokens Used" value={stats.total_tokens_used.toLocaleString()} sub={timeRange} />
          </>
        ) : null}
      </div>

      {stats ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-emerald-300 text-2xl font-bold">{stats.completed}</p>
            <p className="text-emerald-400/60 text-xs mt-0.5 uppercase tracking-wider">Completed</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <p className="text-blue-300 text-2xl font-bold">{stats.running}</p>
            <p className="text-blue-400/60 text-xs mt-0.5 uppercase tracking-wider">Running</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-red-300 text-2xl font-bold">{stats.failed}</p>
            <p className="text-red-400/60 text-xs mt-0.5 uppercase tracking-wider">Failed</p>
          </div>
        </div>
      ) : null}

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">Running Workflows</h2>
          <span className="text-white/40 text-xs">{runningData?.total ?? 0} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Run ID', 'Workflow', 'User', 'Started', 'Progress', 'Elapsed'].map((header) => (
                  <th key={header} className="px-4 py-2.5 text-left text-white/40 text-xs uppercase tracking-wider font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={3} cols={6} />
              ) : (runningData?.running.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                    No workflows currently running
                  </td>
                </tr>
              ) : (
                runningData?.running.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.id)}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.workflow_id)}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.user_id)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDateTime(workflow.started_at)}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">
                      {workflow.total_steps
                        ? `${workflow.current_step ?? 0}/${workflow.total_steps}`
                        : workflow.current_node ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDuration(workflow.elapsed_seconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white text-sm font-semibold">Failed Workflows</h2>
          <span className="text-white/40 text-xs">{errorsData?.total ?? 0} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Run ID', 'Workflow', 'User', 'Status', 'Started', 'Duration'].map((header) => (
                  <th key={header} className="px-4 py-2.5 text-left text-white/40 text-xs uppercase tracking-wider font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows rows={3} cols={6} />
              ) : (errorsData?.errors.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">
                    No failed workflows
                  </td>
                </tr>
              ) : (
                errorsData?.errors.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.id)}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.workflow_id)}</td>
                    <td className="px-4 py-3 text-white/60 font-mono text-xs">{truncateId(workflow.user_id)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDateTime(workflow.started_at)}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDuration(workflow.elapsed_seconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
