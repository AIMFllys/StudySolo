import { KpiCard, formatNumber } from '@/features/admin/shared';
import type { UsageLiveResponse, UsageOverviewResponse } from '@/types/usage';

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

interface DashboardKpiSectionProps {
  overview: UsageOverviewResponse;
  live: UsageLiveResponse | null;
}

export function DashboardKpiSection({ overview, live }: DashboardKpiSectionProps) {
  const cards = [
    {
      label: '助手逻辑请求',
      value: formatNumber(overview.assistant.logical_request_count),
      sub: `近 5 分钟 ${formatNumber(live?.summary.logical_request_count ?? 0)}`,
    },
    {
      label: '工作流逻辑请求',
      value: formatNumber(overview.workflow.logical_request_count),
      sub: `近 5 分钟 ${formatNumber(live?.summary.provider_call_count ?? 0)} 次 API 调用`,
    },
    {
      label: '真实 API 调用',
      value: formatNumber(overview.all.provider_call_count),
      sub: `成功 ${formatNumber(overview.all.successful_provider_call_count)} 次`,
    },
    {
      label: '总 Tokens',
      value: formatNumber(overview.all.total_tokens),
      sub: `助手 ${formatNumber(overview.assistant.total_tokens)} / 工作流 ${formatNumber(overview.workflow.total_tokens)}`,
    },
    {
      label: '总费用',
      value: formatCny(overview.all.total_cost_cny),
      sub: `助手 ${formatCny(overview.assistant.total_cost_cny)} / 工作流 ${formatCny(overview.workflow.total_cost_cny)}`,
    },
    {
      label: '错误率',
      value: formatPercent(overview.all.error_rate),
      sub: `Fallback ${formatPercent(overview.all.fallback_rate)}`,
    },
    {
      label: 'P95 延迟',
      value: `${overview.all.p95_latency_ms ?? 0} ms`,
      sub: '仅统计成功 provider 调用',
    },
    {
      label: '近 5 分钟费用',
      value: formatCny(live?.summary.total_cost_cny ?? 0),
      sub: `近 5 分钟 Tokens ${formatNumber(live?.summary.total_tokens ?? 0)}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} label={card.label} value={card.value} sub={card.sub} />
      ))}
    </div>
  );
}
