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
import { CostBreakdownCard, CostTrendChart, DashboardChartsSection } from './DashboardChartsSection';
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
    <div className="mx-auto min-h-full max-w-[1600px] space-y-5 px-6 py-6">
      <PageHeader
        title="AI 使用量与计费看板"
        description="平台全局 AI 请求、真实 API 调用、Token、CNY 成本与最近调用明细汇聚于此"
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
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            刷新数据
          </button>
        )}
      />

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_360px]"
      >
        <div className="space-y-5">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-[13px] text-destructive flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-destructive">error</span>
              <span className="mt-0.5">{error}</span>
            </div>
          ) : null}

          {loading && !overview && !timeseries ? (
            <EmptyState
              title="正在加载 AI 数据洞察"
              description="正在汇总 Assistant 与 Workflow 两本账的全局数据，请稍候。"
            />
          ) : null}

          {overview ? <DashboardKpiSection overview={overview} live={live} /> : null}
          {timeseries ? (
            <DashboardChartsSection
              timeseries={timeseries}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          ) : null}
        </div>

        <aside className="admin-table-container h-fit">
          <div className="admin-table-header">
            <h3 className="text-lg font-bold text-foreground scholarly-title">实时观察面板</h3>
            <p className="mt-1 scholarly-label text-[10px] text-muted-foreground">LIVE USAGE STREAM</p>
          </div>
          
          <div className="p-6 space-y-6">
            <section className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="scholarly-label text-[10px] text-muted-foreground mb-2">当前时间范围</p>
              <p className="text-2xl font-black tracking-tighter text-foreground">{timeRange}</p>
              <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground/70 font-medium">
                概览与最近调用每 15 秒刷新；时序图与模型排行每 60 秒刷新。
              </p>
            </section>

            <section className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="scholarly-label text-[10px] text-muted-foreground mb-4">近 5 分钟热力数据</p>
              <div className="space-y-3.5 text-[13px]">
                <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground/70 font-medium">逻辑请求</span>
                  <span className="font-bold text-foreground tracking-tight">{live?.summary.logical_request_count?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground/70 font-medium">真实 API 调用</span>
                  <span className="font-bold text-foreground tracking-tight">{live?.summary.provider_call_count?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/30 pb-2.5">
                  <span className="text-muted-foreground/70 font-medium">流通 Tokens</span>
                  <span className="font-bold text-foreground tracking-tight">{live?.summary.total_tokens?.toLocaleString('zh-CN') ?? '0'}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground/70 font-medium">实时消耗费用</span>
                  <span className="font-black text-primary tracking-tight">{formatCny(live?.summary.total_cost_cny ?? 0)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border/40 bg-muted/20 p-5">
              <p className="scholarly-label text-[10px] text-muted-foreground mb-4">两账本实时总计</p>
              <div className="space-y-4">
                <div className="rounded-lg bg-card p-3.5 border border-border/40 shadow-sm">
                  <p className="scholarly-label text-[9px] mb-2.5 text-primary/60">ASSISTANT</p>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground/70 font-medium">总计调用</span>
                    <span className="font-bold text-foreground">{overview?.assistant.provider_call_count?.toLocaleString('zh-CN') ?? '0'} 次</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[13px]">
                    <span className="text-muted-foreground/70 font-medium">总计费用</span>
                    <span className="font-bold text-foreground">{formatCny(overview?.assistant.total_cost_cny ?? 0)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-card p-3.5 border border-border/40 shadow-sm">
                  <p className="scholarly-label text-[9px] mb-2.5 text-primary/60">WORKFLOW</p>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground/70 font-medium">总计调用</span>
                    <span className="font-bold text-foreground">{overview?.workflow.provider_call_count?.toLocaleString('zh-CN') ?? '0'} 次</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[13px]">
                    <span className="text-muted-foreground/70 font-medium">总计费用</span>
                    <span className="font-bold text-foreground">{formatCny(overview?.workflow.total_cost_cny ?? 0)}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </aside>

      </motion.section>

      {/* Full-width cards — outside the sidebar grid */}
      {timeseries ? (
        <CostTrendChart
          timeseries={timeseries}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      ) : null}

      {costSplit && modelBreakdown ? (
        <CostBreakdownCard
          costSplit={costSplit}
          modelBreakdown={modelBreakdown}
        />
      ) : null}

      <DashboardActivityTable recentCalls={recentCalls} loading={loading} />
    </div>
  );
}
