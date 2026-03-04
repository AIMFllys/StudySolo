'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { adminFetch } from '@/services/admin.service';
import type { DashboardCharts, DashboardOverview, DashboardTimeRange } from '@/types/admin';
import { KpiCard, PageHeader } from '@/features/admin/shared';
import {
  chartTooltipStyle,
  Section,
  TIER_COLORS,
  TIER_LABELS,
  TimeRangeSelector,
} from './dashboard-shared';

export function AdminDashboardPageView() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>('7d');
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [chartsError, setChartsError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingOverview(true);
    setOverviewError(null);
    adminFetch<DashboardOverview>('/dashboard/overview')
      .then(setOverview)
      .catch((err) => setOverviewError(err.message ?? 'Failed to load overview'))
      .finally(() => setLoadingOverview(false));
  }, []);

  const fetchCharts = useCallback((range: DashboardTimeRange) => {
    setLoadingCharts(true);
    setChartsError(null);
    adminFetch<DashboardCharts>(`/dashboard/charts?time_range=${range}`)
      .then(setCharts)
      .catch((err) => setChartsError(err.message ?? 'Failed to load charts'))
      .finally(() => setLoadingCharts(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCharts(timeRange);
  }, [fetchCharts, timeRange]);

  const tierPieData = useMemo(() => {
    if (!overview) {
      return [];
    }

    return Object.entries(overview.tier_distribution).map(([key, value]) => ({
      name: TIER_LABELS[key] ?? key,
      value,
      color: TIER_COLORS[key] ?? '#6B7280',
    }));
  }, [overview]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview & key metrics" />

      {overviewError ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{overviewError}</div>
      ) : loadingOverview ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : overview ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard label="Total Users" value={overview.total_users.toLocaleString()} />
          <KpiCard label="Active Users" value={overview.active_users.toLocaleString()} />
          <KpiCard
            label="Today Signups"
            value={overview.today_signups.toLocaleString()}
            sub={`${overview.today_edu_signups} .edu`}
          />
          <KpiCard label="Total Workflow Runs" value={overview.total_workflow_runs.toLocaleString()} />
          <KpiCard label="Today Workflow Runs" value={overview.today_workflow_runs.toLocaleString()} />
          <KpiCard label="Active Subscriptions" value={overview.active_subscriptions.toLocaleString()} />
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider">Trend Charts</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {chartsError ? (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{chartsError}</div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="User Signups">
          {loadingCharts ? (
            <div className="h-56 animate-pulse bg-white/5 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={charts?.signups_chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Line type="monotone" dataKey="signups" name="Signups" stroke="#6366F1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="edu_signups" name=".edu Signups" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        <Section title="Workflow Executions">
          {loadingCharts ? (
            <div className="h-56 animate-pulse bg-white/5 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={charts?.workflow_chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="success" name="Success" fill="#10B981" opacity={0.8} />
                <Bar yAxisId="left" dataKey="failed" name="Failed" fill="#EF4444" opacity={0.8} />
                <Line yAxisId="right" type="monotone" dataKey="total_tokens" name="Tokens" stroke="#8B5CF6" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Section>
      </div>

      <Section title="Tier Distribution">
        {loadingOverview ? (
          <div className="h-56 animate-pulse bg-white/5 rounded-xl" />
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tierPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {tierPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex flex-col gap-3 min-w-[140px]">
              {tierPieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="text-white/60 text-sm flex-1">{entry.name}</span>
                  <span className="text-white text-sm font-semibold">{entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
