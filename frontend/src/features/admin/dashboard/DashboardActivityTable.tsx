'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { RecentCallsResponse } from '@/types/usage';
import {
  EmptyState,
  Pagination,
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
const PAGE_SIZE = 10;

function formatCny(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: value >= 1 ? 2 : 4,
    maximumFractionDigits: value >= 1 ? 2 : 4,
  }).format(value);
}

export function DashboardActivityTable({ recentCalls, loading }: DashboardActivityTableProps) {
  const [page, setPage] = useState(1);

  const allCalls = useMemo(() => recentCalls?.calls ?? [], [recentCalls]);
  const total = allCalls.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedCalls = useMemo(
    () => allCalls.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [allCalls, page],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="admin-table-container"
    >
      <div className="admin-table-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[18px] text-primary">history</span>
          <h2 className="scholarly-label text-[11px] text-foreground/70">最近真实调用</h2>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground/40 tracking-widest">TOTAL: {total}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="admin-table w-full text-left border-collapse">
          <thead>
            <tr>
              {HEADERS.map((header) => (
                <th key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={PAGE_SIZE} cols={7} />
            ) : pagedCalls.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12">
                  <EmptyState title="暂无 AI 调用数据" description="当前时间范围内还没有采集到真实 Provider 调用。" />
                </td>
              </tr>
            ) : (
              pagedCalls.map((call) => (
                <tr key={call.id}>
                  <td className="font-mono text-[12px] text-muted-foreground/60">{truncateId(call.id)}</td>
                  <td>
                    <div className="font-bold text-foreground">
                      {call.source_type}
                      <span className="mx-1 text-muted-foreground/30 font-normal">/</span>
                      <span className="text-muted-foreground/70 font-medium">{call.source_subtype}</span>
                    </div>
                    {call.is_fallback ? (
                      <span className="mt-1 inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-black tracking-widest text-amber-600 border border-amber-200/50">
                        FALLBACK
                      </span>
                    ) : null}
                  </td>
                  <td>
                    <div className="font-bold text-foreground">
                      {call.provider}<span className="mx-1 text-muted-foreground/30 font-normal">/</span>{call.model}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground/60 font-medium">{call.vendor} · {call.billing_channel}</div>
                  </td>
                  <td>
                    <StatusBadge
                      label={call.status}
                      className={call.status === 'success' ? 'border-emerald-500/20 bg-emerald-50 text-emerald-600' : 'border-rose-500/20 bg-rose-50 text-rose-600'}
                    />
                  </td>
                  <td className="font-mono text-[12px] text-muted-foreground/60">{call.total_tokens.toLocaleString('zh-CN')}</td>
                  <td className="font-black text-foreground tracking-tight">{formatCny(call.cost_amount_cny)}</td>
                  <td className="text-[12px] text-muted-foreground/60 font-medium">{formatDateTime(call.started_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/40 p-2 bg-muted/5">
        <Pagination page={page} totalPages={totalPages} total={total} loading={loading} onPageChange={setPage} />
      </div>
    </motion.section>
  );
}

