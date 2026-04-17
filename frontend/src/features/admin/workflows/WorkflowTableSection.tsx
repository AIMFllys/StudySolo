import type { ReactNode } from 'react';
import { TableSkeletonRows } from '@/features/admin/shared';

interface WorkflowTableSectionProps {
  title: string;
  total: number;
  headers: string[];
  loading: boolean;
  emptyText: string;
  emptyColSpan: number;
  accentClassName: string;
  children: ReactNode;
  icon: string;
}

export function WorkflowTableSection({
  title,
  total,
  headers,
  loading,
  emptyText,
  emptyColSpan,
  accentClassName,
  children,
  icon,
}: WorkflowTableSectionProps) {
  return (
    <section className="admin-table-container">
      <div className="admin-table-header flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`material-symbols-outlined text-[18px] ${accentClassName}`}>{icon}</span>
          <h2 className="scholarly-label text-[11px] text-foreground/70">{title}</h2>
        </div>
        <span className="text-[11px] font-bold text-muted-foreground/40 tracking-widest">
          TOTAL: {total}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-left border-collapse">
          <thead>
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={3} cols={emptyColSpan} />
            ) : (
              children || (
                <tr>
                  <td
                    colSpan={emptyColSpan}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground/40">
                      <span className="material-symbols-outlined text-[32px] mb-2 opacity-20">inventory_2</span>
                      <p className="text-[13px] font-medium tracking-wide">{emptyText}</p>
                    </div>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

