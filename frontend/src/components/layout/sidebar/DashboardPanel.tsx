'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRightLeft, DollarSign, TimerReset, Workflow } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getUsageLive, getUsageOverview, getUsageTimeseries } from '@/services/usage.service';
import type { UsageLiveResponse, UsageOverviewResponse, UsageTimeseriesResponse } from '@/types/usage';

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function formatCny(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatChartLabel(value: string) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:00`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="node-paper-bg rounded-xl border-[1.5px] border-border/50 p-3 shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
        {label}
      </div>
      <p className="mt-1.5 text-lg font-bold font-serif text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{subtext}</p>
    </div>
  );
}

function MiniChart({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<{ ts: string; value: number }>;
  dataKey: 'value';
  color: string;
}) {
  return (
    <div className="node-paper-bg rounded-xl border-[1.5px] border-border/50 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{title}</p>
        <p className="font-mono text-[10px] text-muted-foreground">{data.length} pts</p>
      </div>
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid stroke="rgba(120,120,120,0.12)" vertical={false} />
            <XAxis dataKey="ts" tickFormatter={formatChartLabel} tick={{ fontSize: 10 }} />
            <YAxis hide />
            <Tooltip
              formatter={(value: number) => [value.toLocaleString('zh-CN'), title]}
              labelFormatter={(label) => new Date(label).toLocaleString('zh-CN')}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.18} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardPanel() {
  const [overview, setOverview] = useState<UsageOverviewResponse | null>(null);
  const [live, setLive] = useState<UsageLiveResponse | null>(null);
  const [timeseries, setTimeseries] = useState<UsageTimeseriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const onVisibilityChange = () => setIsVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadOverviewAndLive() {
      try {
        const [overviewResult, liveResult] = await Promise.all([
          getUsageOverview('24h'),
          getUsageLive('5m'),
        ]);
        if (cancelled) {
          return;
        }
        setOverview(overviewResult);
        setLive(liveResult);
        setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载个人 AI 使用概览失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadOverviewAndLive();
    if (!isVisible) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadOverviewAndLive();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isVisible]);

  useEffect(() => {
    let cancelled = false;

    async function loadTimeseries() {
      try {
        const result = await getUsageTimeseries('24h', 'all');
        if (!cancelled) {
          setTimeseries(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载个人趋势失败');
        }
      }
    }

    void loadTimeseries();
    if (!isVisible) {
      return () => {
        cancelled = true;
      };
    }

    const intervalId = window.setInterval(() => {
      void loadTimeseries();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isVisible]);

  const callSeries = useMemo(
    () =>
      (timeseries?.points ?? []).map((point) => ({
        ts: point.ts,
        value: point.assistant_calls + point.workflow_calls,
      })),
    [timeseries],
  );

  const costSeries = useMemo(
    () =>
      (timeseries?.points ?? []).map((point) => ({
        ts: point.ts,
        value: Number((point.assistant_cost_cny + point.workflow_cost_cny).toFixed(6)),
      })),
    [timeseries],
  );

  const metrics = overview?.all;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-3 px-1 text-[10px] text-muted-foreground">
          个人 AI 使用镜像，默认展示近 24 小时数据，每 15 秒自动刷新。
        </p>

        {error ? (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && !overview ? (
          <div className="rounded-xl border-[1.5px] border-border/50 px-3 py-6 text-center text-xs text-muted-foreground">
            正在加载个人 AI 使用情况...
          </div>
        ) : null}

        {overview ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={Activity}
                label="助手请求"
                value={formatCompactNumber(overview.assistant.logical_request_count)}
                subtext={`真实 API ${formatCompactNumber(overview.assistant.provider_call_count)} 次`}
              />
              <StatCard
                icon={Workflow}
                label="工作流运行"
                value={formatCompactNumber(overview.workflow.logical_request_count)}
                subtext={`LLM 调用 ${formatCompactNumber(overview.workflow.provider_call_count)} 次`}
              />
              <StatCard
                icon={TimerReset}
                label="总 Tokens"
                value={formatCompactNumber(overview.all.total_tokens)}
                subtext={`近 5 分钟 ${formatCompactNumber(live?.summary.total_tokens ?? 0)}`}
              />
              <StatCard
                icon={DollarSign}
                label="总费用"
                value={formatCny(overview.all.total_cost_cny)}
                subtext={`近 5 分钟 ${formatCny(live?.summary.total_cost_cny ?? 0)}`}
              />
              <StatCard
                icon={AlertTriangle}
                label="错误率"
                value={formatPercent(overview.all.error_rate)}
                subtext={`近 5 分钟 ${formatPercent(live?.summary.error_rate ?? 0)}`}
              />
              <StatCard
                icon={ArrowRightLeft}
                label="Fallback"
                value={formatPercent(overview.all.fallback_rate)}
                subtext={`P95 延迟 ${metrics?.p95_latency_ms ?? 0}ms`}
              />
            </div>

            <div className="mt-3 space-y-2">
              <MiniChart title="近 24h 调用次数" data={callSeries} dataKey="value" color="#0f766e" />
              <MiniChart title="近 24h 费用 CNY" data={costSeries} dataKey="value" color="#0f4c81" />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
