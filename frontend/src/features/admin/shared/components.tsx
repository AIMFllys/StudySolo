import type { ReactNode } from 'react';

/* ─── PageHeader ─── */

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-[#002045] tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-sm font-mono text-[#74777f] uppercase tracking-widest">{description}</p> : null}
      </div>
      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}

/* ─── KpiCard ─── */

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
}

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="rounded-none border border-[#c4c6cf]/60 bg-white p-6 shadow-sm relative overflow-hidden group">
      {/* Hatched pattern overlay on hover */}
      <div className="absolute inset-0 hatched-pattern opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      <div className="relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#002045]/60 font-mono pb-2 border-b border-[#002045]/10 inline-block mb-3">{label}</p>
        <p className="text-3xl font-serif font-black text-[#002045]">{value}</p>
        {sub ? <p className="mt-2 text-[10px] font-mono tracking-widest text-[#74777f] uppercase">{sub}</p> : null}
      </div>
    </div>
  );
}

/* ─── TableSkeletonRows ─── */

interface TableSkeletonRowsProps {
  rows: number;
  cols: number;
}

export function TableSkeletonRows({ rows, cols }: TableSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-[#c4c6cf]/30">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <td key={colIndex} className="px-5 py-4">
              <div className="h-4 w-20 animate-pulse rounded bg-[#002045]/10" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─── Pagination ─── */

interface PaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, loading, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && !total) return null;

  return (
    <div className="flex items-center justify-between border-t border-[#c4c6cf]/60 px-5 py-4 bg-[#FAF9F5]">
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#74777f]">
        Page {page} of {totalPages}
        {total != null ? ` · ${total.toLocaleString()} total` : ''}
      </span>
      <div className="flex gap-2">
        <button
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="rounded-none border border-[#c4c6cf] bg-white px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-[#002045] transition-colors hover:bg-[#002045]/5 hover:border-[#002045]/30 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Prev
        </button>
        <button
          disabled={page >= totalPages || loading}
          onClick={() => onPageChange(page + 1)}
          className="rounded-none border border-[#c4c6cf] bg-white px-4 py-2 font-mono text-[10px] tracking-widest uppercase text-[#002045] transition-colors hover:bg-[#002045]/5 hover:border-[#002045]/30 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

/* ─── StatusBadge ─── */

interface StatusBadgeProps {
  label: string;
  className?: string; // made optional
}

export function StatusBadge({ label, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-none border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${className}`}
    >
      {label}
    </span>
  );
}

/* ─── ToastStack ─── */

interface Toast {
  id: number;
  kind: 'success' | 'error' | 'info';
  message: string;
}

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  const colorMap = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-[#002045]',
  };

  return (
    <div className="fixed right-6 bottom-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-4 rounded-none border border-l-4 p-4 text-sm shadow-md font-mono tracking-wide ${colorMap[toast.kind] ?? colorMap.info}`}
          style={{ borderLeftColor: toast.kind === 'error' ? '#ef4444' : toast.kind === 'success' ? '#10b981' : '#002045' }}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current opacity-50 transition-opacity hover:opacity-100 material-symbols-outlined text-lg"
          >
            close
          </button>
        </div>
      ))}
    </div>
  );
}
