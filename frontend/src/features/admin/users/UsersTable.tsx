import type { PaginatedUserList, UserListItem } from '@/types/admin';
import {
  EmptyState,
  Pagination,
  TableSkeletonRows,
  formatDateTime,
  maskEmail,
} from '@/features/admin/shared';
import { StatusBadgeWithDot, TierBadge } from './user-shared';

interface UsersTableProps {
  data: PaginatedUserList | null;
  loading: boolean;
  page: number;
  selectedUserId: string | null;
  onSelectUser: (user: UserListItem) => void;
  onPageChange: (page: number) => void;
}

export function UsersTable({
  data,
  loading,
  page,
  selectedUserId,
  onSelectUser,
  onPageChange,
}: UsersTableProps) {
  if (!loading && (!data || data.users.length === 0)) {
    return <EmptyState title="暂无用户数据" description="当前筛选条件下没有用户记录。" />;
  }

  return (
    <div className="admin-table-container">
      <div className="overflow-x-auto">
        <table className="admin-table w-full text-left">
          <thead>
            <tr>
              {['邮箱', '会员等级', '状态', '注册时间', '最后登录'].map((header) => (
                <th key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeletonRows rows={8} cols={5} />
            ) : (
              data?.users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className={`cursor-pointer transition-all ${
                    selectedUserId === user.id ? 'bg-primary/5' : ''
                  }`}
                  style={selectedUserId === user.id ? { borderLeft: '3px solid var(--primary)' } : undefined}
                >
                  <td className="font-semibold text-foreground">{maskEmail(user.email)}</td>
                  <td>
                    <TierBadge tier={user.tier} />
                  </td>
                  <td>
                    <StatusBadgeWithDot isActive={user.is_active} />
                  </td>
                  <td className="text-muted-foreground/70">{formatDateTime(user.created_at)}</td>
                  <td className="text-muted-foreground/70">{formatDateTime(user.last_login)}</td>
                </tr>
              ))
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
