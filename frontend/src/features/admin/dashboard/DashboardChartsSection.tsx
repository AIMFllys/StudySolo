'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import type {
  AdminUsageRange,
  CostSplitResponse,
  ModelBreakdownResponse,
  UsageTimeseriesResponse,
} from '@/types/usage';

interface DashboardChartsSectionProps {
  timeseries: UsageTimeseriesResponse;
  modelBreakdown: ModelBreakdownResponse;
  costSplit: CostSplitResponse;
  timeRange: AdminUsageRange;
  onTimeRangeChange: (value: AdminUsageRange) => void;
}

const TIME_RANGE_OPTIONS: { value: AdminUsageRange; label: string }[] = [
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
];

const tooltipStyle = {
  backgroundColor: '#f4f4f0',
  border: '1px solid #c4c6cf',
  borderRadius: '0px',
  color: '#002045',
};

function formatCny(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

function ChartShell({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden border border-[#c4c6cf] bg-[#f4f4f0] p-6 shadow-sm"
    >
      <div className="relative z-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#002045]">{title}</h2>
            <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-[#74777f]">{description}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </motion.section>
  );
}

export function DashboardChartsSection({
  timeseries,
  modelBreakdown,
  costSplit,
  timeRange,
  onTimeRangeChange,
}: DashboardChartsSectionProps) {
  const chartData = timeseries.points.map((point) => ({
    ts: point.ts,
    assistant_calls: point.assistant_calls,
    workflow_calls: point.workflow_calls,
    assistant_tokens: point.assistant_tokens,
    workflow_tokens: point.workflow_tokens,
    assistant_cost_cny: point.assistant_cost_cny,
    workflow_cost_cny: point.workflow_cost_cny,
  }));

  const pieData = costSplit.items.map((item) => ({
    name: item.source_type === 'assistant' ? 'Assistant' : 'Workflow',
    value: item.total_cost_cny,
  }));

  const topModels = modelBreakdown.items.slice(0, 8);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartShell
        title="调用次数趋势"
        description="assistant 与 workflow 两本账的真实 provider 调用次数"
        action={(
          <div className="flex gap-2">
            {TIME_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                className={`border px-3 py-1.5 font-mono text-[10px] tracking-[0.16em] shadow-sm ${
                  option.value === timeRange
                    ? 'border-[#002045] bg-[#002045] text-white'
                    : 'border-[#c4c6cf] bg-[#f4f4f0] text-[#002045] hover:bg-[#ebe9df]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      >
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid stroke="#d5d0c6" strokeDasharray="3 3" />
              <XAxis dataKey="ts" stroke="#74777f" fontSize={12} />
              <YAxis stroke="#74777f" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Bar dataKey="assistant_calls" fill="#0f4c81" name="Assistant" />
              <Bar dataKey="workflow_calls" fill="#0f766e" name="Workflow" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartShell>

      <ChartShell title="Token 趋势" description="成功调用的 token 消耗，按账本拆分">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#d5d0c6" strokeDasharray="3 3" />
              <XAxis dataKey="ts" stroke="#74777f" fontSize={12} />
              <YAxis stroke="#74777f" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="assistant_tokens" stroke="#0f4c81" strokeWidth={2} name="Assistant Tokens" />
              <Line type="monotone" dataKey="workflow_tokens" stroke="#0f766e" strokeWidth={2} name="Workflow Tokens" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartShell>

      <ChartShell title="费用趋势" description="CNY 成本口径，按 assistant / workflow 分开计算">
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#d5d0c6" strokeDasharray="3 3" />
              <XAxis dataKey="ts" stroke="#74777f" fontSize={12} />
              <YAxis stroke="#74777f" fontSize={12} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCny(value), 'Cost']}
              />
              <Legend />
              <Line type="monotone" dataKey="assistant_cost_cny" stroke="#8c6d1f" strokeWidth={2} name="Assistant Cost" />
              <Line type="monotone" dataKey="workflow_cost_cny" stroke="#c05621" strokeWidth={2} name="Workflow Cost" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartShell>

      <ChartShell title="成本拆分与模型排行" description="左侧看账本拆分，右侧看平台级 SKU 成本排行">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatCny(value), 'Cost']}
                />
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={88} innerRadius={44}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={index === 0 ? '#0f4c81' : '#0f766e'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-hidden border border-[#c4c6cf]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#c4c6cf] bg-[#efeeea]">
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-[#002045]">SKU</th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-[#002045]">CALLS</th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-[#002045]">TOKENS</th>
                  <th className="px-4 py-3 font-mono text-[10px] tracking-[0.16em] text-[#002045]">COST</th>
                </tr>
              </thead>
              <tbody>
                {topModels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#74777f]">
                      暂无模型账本数据
                    </td>
                  </tr>
                ) : (
                  topModels.map((item) => (
                    <tr key={item.sku_id ?? `${item.provider}-${item.model}`} className="border-b border-[#ddd8cf] last:border-b-0">
                      <td className="px-4 py-3 text-sm text-[#002045]">
                        <div>{item.provider}/{item.model}</div>
                        <div className="text-[10px] text-[#74777f]">{item.vendor} · {item.billing_channel}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[#74777f]">{item.provider_call_count.toLocaleString('zh-CN')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#74777f]">{item.total_tokens.toLocaleString('zh-CN')}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[#002045]">{formatCny(item.total_cost_cny)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </ChartShell>
    </div>
  );
}
