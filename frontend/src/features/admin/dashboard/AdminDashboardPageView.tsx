'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getAdminAiCostSplit,
  getAdminAiLive,
  getAdminAiModelBreakdown,
  getAdminAiOverview,
  getAdminAiRecentCalls,
  getAdminAiTimeseries,
} from '@/services/admin.service';
import type {
  AdminUsageRange,
  CostSplitResponse,
  ModelBreakdownResponse,
  RecentCallsResponse,
  UsageLiveResponse,
  UsageOverviewResponse,
  UsageTimeseriesResponse,
} from '@/types/usage';
import { EmptyState, PageHeader } from '@/features/admin/shared';
import { DashboardActivityTable } from './DashboardActivityTable';
import { DashboardChartsSection } from './DashboardChartsSection';
import { DashboardKpiSection } from './DashboardKpiSection';

function formatCny(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

export function AdminDashboardPageView() {
  const [timeRange, setTimeRange] = useState<AdminUsageRange>('7d');
  const [overview, setOverview] = useState<UsageOverviewResponse | null>(null);
  const [live, setLive] = useState<UsageLiveResponse | null>(null);
  const [timeseries, setTimeseries] = useState<UsageTimeseriesResponse | null>(null);
  const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdownResponse | null>(null);
  const [costSplit, setCostSplit] = useState<CostSplitResponse | null>(null);
  const [recentCalls, setRecentCalls] = useState<RecentCallsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const onVisibilityChange = () => setIsVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFastData() {
      try {
        const [overviewResult, liveResult, recentCallsResult] = await Promise.all([
          getAdminAiOverview(timeRange),
          getAdminAiLive('5m'),
          getAdminAiRecentCalls(20),
        ]);
        if (cancelled) {
          return;
        }
        setOverview(overviewResult);
        setLive(liveResult);
        setRecentCalls(recentCallsResult);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载后台 AI 仪表盘失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadFastData();
    if (!isVisible) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadFastData();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isVisible, timeRange]);

  useEffect(() => {
    let cancelled = false;

    async function loadSlowData() {
      try {
        const [timeseriesResult, modelBreakdownResult, costSplitResult] = await Promise.all([
          getAdminAiTimeseries(timeRange, 'all'),
          getAdminAiModelBreakdown(timeRange, 'all'),
          getAdminAiCostSplit(timeRange),
        ]);
        if (cancelled) {
          return;
        }
        setTimeseries(timeseriesResult);
        setModelBreakdown(modelBreakdownResult);
        setCostSplit(costSplitResult);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载后台 AI 图表失败');
        }
      }
    }

    void loadSlowData();
    if (!isVisible) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadSlowData();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isVisible, timeRange]);

  return (
    <div className="mx-auto min-h-full max-w-[1600px] space-y-6 px-8 py-8">
      <PageHeader
        title="AI 使用量与计费看板"
        description="平台全局 AI 请求、真实 API 调用、Token、CNY 成本与最近调用明细"
        eyebrow="GLOBAL_AI_OBSERVABILITY"
        action={(
          <button
            onClick={() => {
              setLoading(true);
              void Promise.all([
                getAdminAiOverview(timeRange).then(setOverview),
                getAdminAiLive('5m').then(setLive),
                getAdminAiRecentCalls(20).then(setRecentCalls),
                getAdminAiTimeseries(timeRange, 'all').then(setTimeseries),
                getAdminAiModelBreakdown(timeRange, 'all').then(setModelBreakdown),
                getAdminAiCostSplit(timeRange).then(setCostSplit),
              ]).catch((err: unknown) => {
                setError(err instanceof Error ? err.message : '刷新后台 AI 仪表盘失败');
              }).finally(() => {
                setLoading(false);
              });
            }}
            className="border border-[#002045] bg-[#002045] px-5 py-2.5 font-['Space_Grotesk'] text-sm font-semibold tracking-[0.08em] text-white shadow-sm transition-opacity hover:opacity-90"
          >
            刷新数据
          </button>
        )}
      />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]"
      >
        <div className="space-y-6">
          {error ? (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          ) : null}

          {loading && !overview && !timeseries ? (
            <EmptyState
              title="正在加载 AI 使用与计费仪表盘"
              description="正在汇总 assistant 与 workflow 两本账的全局数据。"
            />
          ) : null}

          {overview ? <DashboardKpiSection overview={overview} live={live} /> : null}
          {timeseries && modelBreakdown && costSplit ? (
            <DashboardChartsSection
              timeseries={timeseries}
              modelBreakdown={modelBreakdown}
              costSplit={costSplit}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          ) : null}
        </div>

        <aside className="border border-[#c4c6cf] bg-[#efeeea] p-6 shadow-sm">
          <p className="font-serif text-2xl font-bold text-[#002045]">实时观察</p>
          <p className="mt-2 font-mono text-[10px] tracking-[0.18em] text-[#74777f]">LIVE_USAGE_PANE</p>
          <div className="mt-6 space-y-6">
            <section className="border border-[#c4c6cf] bg-[#f4f4f0] p-4 shadow-sm">
              <p className="font-mono text-[10px] tracking-[0.16em] text-[#74777f]">当前时间范围</p>
              <p className="mt-2 font-serif text-2xl font-bold text-[#002045]">{timeRange}</p>
              <p className="mt-3 text-sm leading-6 text-[#43474e]">
                概览与 recent calls 每 15 秒刷新，时序图和模型排行每 60 秒刷新。
              </p>
            </section>

            <section className="border border-[#c4c6cf] bg-[#f4f4f0] p-4 shadow-sm">
              <p className="font-mono text-[10px] tracking-[0.16em] text-[#74777f]">近 5 分钟</p>
              <div className="mt-3 space-y-2 text-sm text-[#43474e]">
                <div className="flex items-center justify-between">
                  <span>逻辑请求</span>
                  <span className="font-mono text-[#002045]">{live?.summary.logical_request_count?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>真实 API 调用</span>
                  <span className="font-mono text-[#002045]">{live?.summary.provider_call_count?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tokens</span>
                  <span className="font-mono text-[#002045]">{live?.summary.total_tokens?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>费用</span>
                  <span className="font-mono text-[#002045]">{formatCny(live?.summary.total_cost_cny ?? 0)}</span>
                </div>
              </div>
            </section>

            <section className="border border-[#c4c6cf] bg-[#f4f4f0] p-4 shadow-sm">
              <p className="font-mono text-[10px] tracking-[0.16em] text-[#74777f]">两本账当前总览</p>
              <div className="mt-3 space-y-3 text-sm text-[#43474e]">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.12em] text-[#74777f]">ASSISTANT</p>
                  <p className="mt-1">调用 {overview?.assistant.provider_call_count?.toLocaleString('zh-CN') ?? '0'} 次</p>
                  <p>费用 {formatCny(overview?.assistant.total_cost_cny ?? 0)}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.12em] text-[#74777f]">WORKFLOW</p>
                  <p className="mt-1">调用 {overview?.workflow.provider_call_count?.toLocaleString('zh-CN') ?? '0'} 次</p>
                  <p>费用 {formatCny(overview?.workflow.total_cost_cny ?? 0)}</p>
                </div>
              </div>
            </section>
          </div>
        </aside>
      </motion.section>

      <DashboardActivityTable recentCalls={recentCalls} loading={loading} />
    </div>
  );
}
