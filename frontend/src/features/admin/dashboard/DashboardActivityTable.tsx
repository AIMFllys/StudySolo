'use client';

import { motion } from 'framer-motion';
import type { RecentCallsResponse } from '@/types/usage';
import {
  EmptyState,
  StatusBadge,
  TableSkeletonRows,
  formatDateTime,
  truncateId,
} from '@/features/admin/shared';

interface DashboardActivityTableProps {
  recentCalls: RecentCallsResponse | null;
  loading: boolean;
}

const HEADERS = ['调用 ID', '账本来源', '模型', '状态', 'Tokens', '费用', '开始时间'];

function formatCny(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

export function DashboardActivityTable({ recentCalls, loading }: DashboardActivityTableProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden border border-[#c4c6cf] bg-[#f4f4f0] shadow-sm"
    >
      <div className="border-b border-[#c4c6cf] bg-[#efeeea] px-6 py-4">
        <h2 className="font-serif text-xl font-bold text-[#002045]">最近真实调用</h2>
        <p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-[#74777f]">
          便于追踪失败、fallback 与平台级成本
        </p>
      </div>

      {loading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#c4c6cf]">
                {HEADERS.map((header) => (
                  <th key={header} className="px-5 py-4 font-mono text-[10px] tracking-[0.16em] text-[#002045]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableSkeletonRows rows={8} cols={7} />
            </tbody>
          </table>
        </div>
      ) : !recentCalls || recentCalls.calls.length === 0 ? (
        <div className="p-6">
          <EmptyState title="暂无 AI 调用账本" description="当前时间范围内还没有采集到真实 provider 调用。" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#c4c6cf]">
                {HEADERS.map((header) => (
                  <th key={header} className="px-5 py-4 font-mono text-[10px] tracking-[0.16em] text-[#002045]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCalls.calls.map((call) => (
                <tr key={call.id} className="border-b border-[#ddd8cf] transition-colors last:border-b-0 hover:bg-[#ebe9df]">
                  <td className="px-5 py-4 font-mono text-xs text-[#74777f]">{truncateId(call.id)}</td>
                  <td className="px-5 py-4 text-sm text-[#002045]">
                    {call.source_type}/{call.source_subtype}
                    {call.is_fallback ? (
                      <span className="ml-2 font-mono text-[10px] text-[#b45309]">FALLBACK</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-sm text-[#74777f]">
                    <div>{call.provider}/{call.model}</div>
                    <div className="text-[10px]">{call.vendor} · {call.billing_channel}</div>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge
                      label={call.status}
                      className={
                        call.status === 'success'
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                          : 'border-rose-300 bg-rose-50 text-rose-700'
                      }
                    />
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-[#74777f]">{call.total_tokens.toLocaleString('zh-CN')}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#002045]">{formatCny(call.cost_amount_cny)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-[#74777f]">{formatDateTime(call.started_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
}
