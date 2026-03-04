'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminFetch } from '@/services/admin.service';
import type { TierValue, UserDetailResponse } from '@/types/admin';
import { ToastStack } from '@/features/admin/shared';
import { useToastQueue } from '@/hooks/use-toast-queue';
import { UserDetailLoading } from './UserDetailLoading';
import { UserDetailPanels } from './UserDetailPanels';

export function AdminUserDetailPageView() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { toasts, pushToast, dismissToast } = useToastQueue();

  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierValue>('free');

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch<UserDetailResponse>(`/users/${userId}`);
      setData(result);
      setSelectedTier(result.user.tier as TierValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  async function handleStatusToggle() {
    if (!data) {
      return;
    }

    const confirmed = window.confirm(
      data.user.is_active ? `Deactivate user ${data.user.email}?` : `Activate user ${data.user.email}?`
    );
    if (!confirmed) {
      return;
    }

    setStatusLoading(true);
    try {
      const result = await adminFetch<{ success: boolean; user_id: string; is_active: boolean }>(
        `/users/${userId}/status`,
        { method: 'PUT' }
      );
      setData((current) => (current ? { ...current, user: { ...current.user, is_active: result.is_active } } : current));
      pushToast('success', result.is_active ? 'User activated successfully' : 'User deactivated successfully');
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleRoleChange() {
    if (!data) {
      return;
    }

    if (selectedTier === data.user.tier) {
      pushToast('error', 'Please select a different tier');
      return;
    }

    setRoleLoading(true);
    try {
      const result = await adminFetch<{ success: boolean; user_id: string; tier: string }>(`/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ tier: selectedTier }),
      });
      setData((current) => (current ? { ...current, user: { ...current.user, tier: result.tier } } : current));
      pushToast('success', `Role changed to ${result.tier}`);
    } catch (err) {
      pushToast('error', err instanceof Error ? err.message : 'Failed to change role');
    } finally {
      setRoleLoading(false);
    }
  }

  if (loading) {
    return <UserDetailLoading />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.push('/admin-analysis/users')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back to Users
        </button>
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => void fetchUser()} className="text-red-300 hover:text-red-200 underline text-xs ml-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/admin-analysis/users')}
          className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">{data.user.email}</h1>
          <p className="text-white/40 text-sm mt-0.5">User ID: {data.user.id}</p>
        </div>
      </div>

      <UserDetailPanels
        data={data}
        selectedTier={selectedTier}
        statusLoading={statusLoading}
        roleLoading={roleLoading}
        onSelectTier={setSelectedTier}
        onToggleStatus={() => void handleStatusToggle()}
        onApplyTier={() => void handleRoleChange()}
      />
    </div>
  );
}
