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
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Published</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/50">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={8} cols={6} />
            ) : !data || data.notices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-white/30">
                  No notices found
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
                    className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <td className="max-w-xs px-4 py-3 text-white/80 transition-colors group-hover:text-white">
                      <span className="line-clamp-1">{notice.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={typeBadge.label} className={typeBadge.className} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={statusBadge.label} className={statusBadge.className} />
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">{formatDate(notice.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-white/50">{formatDate(notice.published_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                        {notice.status === 'draft' ? (
                          <>
                            <button
                              onClick={() => onPublish(notice.id)}
                              disabled={actionLoading === notice.id}
                              className="rounded-md border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {actionLoading === notice.id ? '...' : 'Publish'}
                            </button>
                            <button
                              onClick={() => onDelete(notice.id, notice.title)}
                              disabled={actionLoading === notice.id}
                              className="rounded-md border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => router.push(`/admin-analysis/notices/${notice.id}/edit`)}
                            className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                          >
                            Edit →
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

      <Pagination
        page={page}
        totalPages={data?.total_pages ?? 1}
        total={data?.total}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
