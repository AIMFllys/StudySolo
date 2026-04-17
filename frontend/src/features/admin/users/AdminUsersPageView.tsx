'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getUsers } from '@/services/admin.service';
import type { PaginatedUserList, StatusFilter, TierFilter, UserListItem } from '@/types/admin';
import { AdminSelect, EmptyState, PageHeader, buildPaginationParams } from '@/features/admin/shared';
import { UserQuickPanel } from './UserQuickPanel';
import { UsersTable } from './UsersTable';

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: 'all', label: '全部等级' },
  { value: 'free', label: '免费版' },
  { value: 'pro', label: '专业版' },
  { value: 'pro_plus', label: '专业增强版' },
  { value: 'ultra', label: '旗舰版' },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'inactive', label: '停用' },
];

export function AdminUsersPageView() {
  const [data, setData] = useState<PaginatedUserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  const queryParams = useMemo(() => {
    const params = buildPaginationParams(page, 20);
    if (search) params.set('search', search);
    if (tierFilter !== 'all') params.set('tier', tierFilter);
    if (statusFilter !== 'all') params.set('is_active', statusFilter === 'active' ? 'true' : 'false');
    return params;
  }, [page, search, statusFilter, tierFilter]);

  const fetchUserList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(queryParams);
      setData(result);
      setSelectedUser((current) => result.users.find((user) => user.id === current?.id) ?? result.users[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载用户列表失败');
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    void fetchUserList();
  }, [fetchUserList]);

  return (
    <div className="mx-auto min-h-full max-w-[1600px] space-y-5 px-6 py-6">
      <PageHeader
        title="用户管理"
        description={data ? `共 ${data.total.toLocaleString('zh-CN')} 位注册用户` : '按邮箱、等级和状态筛选用户'}
      />

      <section className="admin-table-container p-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[2fr,1fr,1fr,auto] items-center">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-muted-foreground/40">
              search
            </span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="输入邮箱地址进行检索..."
              className="admin-input pl-11"
            />
          </div>
          <AdminSelect
            value={tierFilter}
            options={TIER_OPTIONS}
            onChange={(event) => {
              setTierFilter(event.target.value as TierFilter);
              setPage(1);
            }}
          />
          <AdminSelect
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
          />
          <button
            onClick={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            className="admin-btn-primary"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            查询记录
          </button>
        </div>
      </section>

      {error ? (
        <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-destructive">error</span>
            <span className="text-[13px] font-medium tracking-wide text-destructive">系统错误：{error}</span>
          </div>
          <button
            onClick={() => void fetchUserList()}
            className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            重新加载
          </button>
        </div>
      ) : null}

      {!loading && !data ? (
        <EmptyState title="暂无用户数据" description="当前无法获取用户列表，请稍后重试。" />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr),360px]">
          <UsersTable
            data={data}
            loading={loading}
            page={page}
            selectedUserId={selectedUser?.id ?? null}
            onSelectUser={setSelectedUser}
            onPageChange={setPage}
          />
          <UserQuickPanel user={selectedUser} />
        </div>
      )}
    </div>
  );
}
