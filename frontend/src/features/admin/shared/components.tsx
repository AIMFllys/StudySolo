'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface AdminSelectOption {
  value: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground scholarly-title">{title}</h1>
        {description && <p className="text-[13px] text-muted-foreground leading-relaxed max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
    </div>
  );
}

interface KpiCardProps { label: string; value: string; sub?: string }

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md">
      <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      <p className="scholarly-label">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        {sub && <span className="text-[11px] font-medium text-muted-foreground/60">{sub}</span>}
      </div>
    </div>
  );
}

interface AdminSelectProps {
  value: string;
  options: AdminSelectOption[];
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export function AdminSelect({ value, options, onChange, className = '' }: AdminSelectProps) {
  return (
    <div className={`relative inline-block min-w-[180px] ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="peer w-full cursor-pointer appearance-none rounded-lg border border-border/60 bg-card px-4 py-2.5 pr-10 text-[13px] font-medium text-foreground transition-all hover:border-primary/30 hover:bg-accent/5 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
      >
        {options.map((opt) => (
          <option key={`${opt.value || 'empty'}-${opt.label}`} value={opt.value} className="bg-card py-2">{opt.label}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-muted-foreground transition-colors peer-focus:text-primary">
        <span className="material-symbols-outlined text-[18px]">unfold_more</span>
      </div>
    </div>
  );
}


interface TableSkeletonRowsProps { rows: number; cols: number }

export function TableSkeletonRows({ rows, cols }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-border last:border-0">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <div className="h-3.5 w-20 animate-pulse rounded bg-secondary" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, loading, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && total == null) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <span className="text-[12px] text-muted-foreground">
        第 <span className="text-foreground font-medium">{page}</span> / {totalPages} 页
        {total != null ? ` · 共 ${total.toLocaleString('zh-CN')} 条` : ''}
      </span>
      <div className="flex gap-1.5">
        <button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
          上一页
        </button>
        <button disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40">
          下一页
        </button>
      </div>
    </div>
  );
}

interface StatusBadgeProps { label: string; className?: string }

export function StatusBadge({ label, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}>{label}</span>
  );
}

interface EmptyStateProps { title: string; description: string }

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-border px-6 py-14 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
        <span className="material-symbols-outlined text-[20px] text-muted-foreground">inbox</span>
      </div>
      <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-[12px] text-muted-foreground/60 max-w-xs">{description}</p>
    </div>
  );
}

interface Toast { id: number; kind: 'success' | 'error' | 'info'; message: string }
interface ToastStackProps { toasts: Toast[]; onDismiss: (id: number) => void }

const TOAST_STYLES = {
  success: 'border-accent/30 bg-accent/10 text-accent',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-primary/30 bg-primary/10 text-primary',
};
const TOAST_ICONS = { success: 'check_circle', error: 'error', info: 'info' };

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <motion.div key={t.id}
          initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.15 }}
          className={`flex items-start gap-2.5 rounded-md border p-3 backdrop-blur-sm min-w-[280px] ${TOAST_STYLES[t.kind] ?? TOAST_STYLES.info}`}>
          <span className="material-symbols-outlined mt-0.5 text-[18px] opacity-80">{TOAST_ICONS[t.kind]}</span>
          <span className="flex-1 text-[13px] font-medium leading-relaxed">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="material-symbols-outlined rounded p-0.5 text-[16px] opacity-50 transition-opacity hover:opacity-100">close</button>
        </motion.div>
      ))}
    </div>
  );
}
