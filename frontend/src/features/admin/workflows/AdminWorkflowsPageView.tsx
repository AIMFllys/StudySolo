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
    <div className="space-y-10 px-8 py-8 md:px-12 max-w-[1600px] mx-auto min-h-full">
      <PageHeader
        title="Workflow Orchestration"
        description={runningData ? `${runningData.total} NODE(S) RUNNING NOW` : 'FETCHING WORKFLOW METRY'}
        action={
          <div className="flex items-center gap-2 bg-white border border-[#c4c6cf]/60 p-1 shadow-sm">
            {(['7d', '30d', '90d'] as WorkflowTimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 font-mono text-[10px] tracking-widest uppercase font-bold transition-all ${
                  timeRange === range 
                    ? 'bg-[#002045] text-white border-transparent' 
                    : 'text-[#74777f] hover:text-[#002045] hover:bg-[#FAF9F5]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <div className="p-4 bg-[#FAF9F5] border-l-4 border-l-red-600 border border-[#c4c6cf]/60 flex items-center justify-between font-mono text-sm shadow-sm">
          <span className="text-red-700 font-bold tracking-wide">SYSTEM ERROR: {error}</span>
          <button onClick={() => void fetchAll()} className="text-[#002045] hover:text-red-700 hover:underline underline-offset-4 tracking-widest uppercase text-[10px] font-bold">
            Execute Retry
          </button>
        </div>
      ) : null}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white border border-[#c4c6cf]/60 p-6 h-32 animate-pulse shadow-sm" />
          ))
        ) : stats ? (
          <>
            <KpiCard label="Total Executions" value={stats.total_runs.toLocaleString()} sub={`Range: ${timeRange}`} />
            <KpiCard label="Success Index" value={`${(stats.success_rate * 100).toFixed(1)}%`} sub={`${stats.completed} Verified`} />
            <KpiCard label="Time Avg (Seconds)" value={formatDuration(stats.avg_duration_seconds)} sub="Completed Only" />
            <KpiCard label="LLM Token Output" value={stats.total_tokens_used.toLocaleString()} sub={`Range: ${timeRange}`} />
          </>
        ) : null}
      </div>

      {/* State Ledger Row */}
      {stats ? (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white border border-[#c4c6cf]/60 border-t-8 border-t-emerald-700 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 hatched-pattern opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#002045]/60 font-bold mb-4">Operations Completed</p>
            <p className="font-serif text-5xl font-black text-[#002045]">{stats.completed}</p>
          </div>
          <div className="bg-white border border-[#c4c6cf]/60 border-t-8 border-t-blue-600 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 hatched-pattern opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#002045]/60 font-bold mb-4">Nodes Running</p>
            <p className="font-serif text-5xl font-black text-[#002045]">{stats.running}</p>
          </div>
          <div className="bg-white border border-[#c4c6cf]/60 border-t-8 border-t-red-600 p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 hatched-pattern opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" />
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#002045]/60 font-bold mb-4">Integrity Fails</p>
            <p className="font-serif text-5xl font-black text-red-700">{stats.failed}</p>
          </div>
        </div>
      ) : null}

      {/* Running Workflows Table */}
      <div className="bg-white border border-[#c4c6cf]/60 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between border-b-2 border-[#002045] bg-[#FAF9F5]">
          <h2 className="text-[#002045] text-sm font-bold font-mono tracking-widest uppercase">Active Node Stream</h2>
          <span className="text-[#74777f] font-mono text-[10px] uppercase tracking-widest">{runningData?.total ?? 0} ACTIVE</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#002045]/20">
                {['ID Hash', 'Blueprint', 'Entity', 'Timestamp', 'Progression', 'Elapsed'].map((header) => (
                  <th key={header} className="px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[#002045]/60">
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
                  <td colSpan={6} className="px-6 py-12 text-center text-[#74777f] font-mono tracking-widest text-xs uppercase bg-[#FAF9F5]/30">
                    No active processes detected
                  </td>
                </tr>
              ) : (
                runningData?.running.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-[#c4c6cf]/30 hover:bg-[#FAF9F5] transition-colors group">
                    <td className="px-6 py-4">
                        <span className="font-mono text-xs text-[#002045] font-bold tracking-wider group-hover:text-blue-700 transition-colors uppercase cursor-pointer">
                            #{truncateId(workflow.id)}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#43474e] tracking-wider uppercase">{truncateId(workflow.workflow_id)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#43474e] tracking-wider uppercase">{truncateId(workflow.user_id)}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#74777f] uppercase tracking-wider">{formatDateTime(workflow.started_at)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#002045] font-bold tracking-widest">
                      {workflow.total_steps
                        ? `${workflow.current_step ?? 0}/${workflow.total_steps}`
                        : workflow.current_node ?? 'AWAITING'}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#74777f] tracking-wide">{formatDuration(workflow.elapsed_seconds)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Failed Workflows Table */}
      <div className="bg-white border border-[#c4c6cf]/60 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between border-b-2 border-red-700 bg-red-50/30">
          <h2 className="text-red-800 text-sm font-bold font-mono tracking-widest uppercase">System Fault Logs</h2>
          <span className="text-red-700/60 font-mono text-[10px] uppercase tracking-widest">{errorsData?.total ?? 0} LOGGED</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-[#002045]/20">
                {['ID Hash', 'Blueprint', 'Entity', 'Fault Code', 'Timestamp', 'Duration'].map((header) => (
                  <th key={header} className="px-6 py-4 font-mono text-[10px] uppercase tracking-[0.2em] font-bold text-[#002045]/60">
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
                  <td colSpan={6} className="px-6 py-12 text-center text-[#74777f] font-mono tracking-widest text-xs uppercase bg-[#FAF9F5]/30">
                    No critical faults recorded
                  </td>
                </tr>
              ) : (
                errorsData?.errors.map((workflow) => (
                  <tr key={workflow.id} className="border-b border-[#c4c6cf]/30 hover:bg-red-50/30 transition-colors group">
                    <td className="px-6 py-4">
                        <span className="font-mono text-xs text-[#002045] font-bold tracking-wider group-hover:text-red-700 transition-colors uppercase cursor-pointer">
                            #{truncateId(workflow.id)}
                        </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#43474e] tracking-wider uppercase">{truncateId(workflow.workflow_id)}</td>
                    <td className="px-6 py-4 font-mono text-xs text-[#43474e] tracking-wider uppercase">{truncateId(workflow.user_id)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-none text-[10px] font-bold font-mono tracking-widest uppercase bg-red-50 border border-red-200 text-red-700">
                        {workflow.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#74777f] uppercase tracking-wider">{formatDateTime(workflow.started_at)}</td>
                    <td className="px-6 py-4 font-mono text-[11px] text-[#74777f] tracking-wide">{formatDuration(workflow.elapsed_seconds)}</td>
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
