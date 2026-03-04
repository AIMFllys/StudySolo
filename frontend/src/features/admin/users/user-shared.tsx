import type { ReactNode } from 'react';
import { TIER_BADGE, resolveBadgeStyle } from '@/features/admin/shared';

export const TIER_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'pro_plus', label: 'Pro+' },
  { value: 'ultra', label: 'Ultra' },
] as const;

export function TierBadge({ tier }: { tier: string }) {
  const badge = resolveBadgeStyle(TIER_BADGE, tier, tier);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export function StatusBadgeWithDot({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
        isActive
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : 'bg-red-500/20 text-red-300 border-red-500/30'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/5 last:border-0">
      <span className="text-white/40 text-sm">{label}</span>
      <span className="text-white/80 text-sm text-right">{children}</span>
    </div>
  );
}
