import type { UserDetailResponse, TierValue } from '@/types/admin';
import { KpiCard, formatDateTime } from '@/features/admin/shared';
import { InfoRow, StatusBadgeWithDot, TierBadge, TIER_OPTIONS } from './user-shared';

interface UserDetailPanelsProps {
  data: UserDetailResponse;
  selectedTier: TierValue;
  statusLoading: boolean;
  roleLoading: boolean;
  onSelectTier: (tier: TierValue) => void;
  onToggleStatus: () => void;
  onApplyTier: () => void;
}

export function UserDetailPanels({
  data,
  selectedTier,
  statusLoading,
  roleLoading,
  onSelectTier,
  onToggleStatus,
  onApplyTier,
}: UserDetailPanelsProps) {
  const { user, subscription, usage_stats: usage } = data;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Runs" value={usage.total_runs.toLocaleString()} />
        <KpiCard label="Total Tokens" value={usage.total_tokens.toLocaleString()} />
        <KpiCard label="Last 30 Days" value={usage.last_30_days_runs.toLocaleString()} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">User Information</h2>
          <InfoRow label="Email">{user.email}</InfoRow>
          <InfoRow label="Tier">
            <TierBadge tier={user.tier} />
          </InfoRow>
          <InfoRow label="Status">
            <StatusBadgeWithDot isActive={user.is_active} />
          </InfoRow>
          <InfoRow label="Created At">{formatDateTime(user.created_at)}</InfoRow>
          <InfoRow label="Last Login">{formatDateTime(user.last_login)}</InfoRow>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Subscription</h2>
          {subscription ? (
            <>
              <InfoRow label="Plan">{subscription.plan}</InfoRow>
              <InfoRow label="Status">{subscription.status}</InfoRow>
              <InfoRow label="Period Start">{formatDateTime(subscription.current_period_start)}</InfoRow>
              <InfoRow label="Period End">{formatDateTime(subscription.current_period_end)}</InfoRow>
              {subscription.amount !== null ? (
                <InfoRow label="Amount">
                  {subscription.amount} {subscription.currency?.toUpperCase() ?? ''}
                </InfoRow>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-white/30">
              <p className="text-sm">No subscription</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Account Status</h2>
          <p className="text-white/50 text-sm mb-4">
            Current status: <StatusBadgeWithDot isActive={user.is_active} />
          </p>
          <button
            onClick={onToggleStatus}
            disabled={statusLoading}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              user.is_active
                ? 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                : 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {statusLoading ? 'Processing...' : user.is_active ? 'Deactivate User' : 'Activate User'}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
          <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">Change Role</h2>
          <p className="text-white/50 text-sm mb-4">
            Current tier: <TierBadge tier={user.tier} />
          </p>
          <div className="flex gap-3">
            <select
              value={selectedTier}
              onChange={(event) => onSelectTier(event.target.value as TierValue)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition cursor-pointer"
            >
              {TIER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-[#0F172A]">
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={onApplyTier}
              disabled={roleLoading || selectedTier === user.tier}
              className="px-5 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/30 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roleLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
