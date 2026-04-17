import { useRouter } from 'next/navigation';
import type { PaginatedNoticeList } from '@/types/admin';
import {
  NOTICE_STATUS_BADGE,
  NOTICE_TYPE_BADGE,
  Pagination,
  StatusBadge,
  TableSkeletonRows,
  formatDate,
  resolveBadgeStyle,
} from '@/features/admin/shared';

interface AdminNoticesTableProps {
  data: PaginatedNoticeList | null;
  loading: boolean;
  page: number;
  actionLoading: string | null;
  onPageChange: (page: number) => void;
  onPublish: (noticeId: string) => void;
  onDelete: (noticeId: string, title: string) => void;
}

export function AdminNoticesTable({
  data,
  loading,
  page,
  actionLoading,
  onPageChange,
  onPublish,
  onDelete,
}: AdminNoticesTableProps) {
  const router = useRouter();

  return (
    <div className="admin-table-container">
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-left border-collapse">
          <thead>
            <tr>
              <th>标题</th>
              <th>类型</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>发布时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={8} cols={6} />
            ) : !data || data.notices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground/40">
                    <span className="material-symbols-outlined text-[32px] mb-2 opacity-20">inventory_2</span>
                    <p className="text-[13px] font-medium tracking-wide">暂无公告</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.notices.map((notice) => {
                const typeBadge = resolveBadgeStyle(NOTICE_TYPE_BADGE, notice.type, notice.type);
                const statusBadge = resolveBadgeStyle(NOTICE_STATUS_BADGE, notice.status, notice.status);

                return (
                  <tr
                    key={notice.id}
                    onClick={() => router.push(`/admin-analysis/notices/${notice.id}/edit`)}
                    className="cursor-pointer"
                  >
                    <td className="max-w-xs">
                      <span className="line-clamp-1 font-bold text-foreground">{notice.title}</span>
                    </td>
                    <td>
                      <StatusBadge label={typeBadge.label} className={typeBadge.className} />
                    </td>
                    <td>
                      <StatusBadge label={statusBadge.label} className={statusBadge.className} />
                    </td>
                    <td className="text-muted-foreground/70">{formatDate(notice.created_at)}</td>
                    <td className="text-muted-foreground/70">{formatDate(notice.published_at)}</td>
                    <td>
                      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        {notice.status === 'draft' ? (
                          <>
                            <button
                              onClick={() => onPublish(notice.id)}
                              disabled={actionLoading === notice.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-card px-3 py-1.5 text-[12px] font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-40"
                            >
                              {actionLoading === notice.id ? '...' : '发布'}
                            </button>
                            <button
                              onClick={() => onDelete(notice.id, notice.title)}
                              disabled={actionLoading === notice.id}
                              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-card px-3 py-1.5 text-[12px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-40"
                            >
                              删除
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => router.push(`/admin-analysis/notices/${notice.id}/edit`)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            编辑
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border/40 p-2 bg-muted/5">
        <Pagination
          page={page}
          totalPages={data?.total_pages ?? 1}
          total={data?.total}
          loading={loading}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}

