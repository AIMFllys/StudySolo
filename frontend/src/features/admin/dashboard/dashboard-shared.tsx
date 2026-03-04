import type { ReactNode } from 'react';
import type { DashboardTimeRange } from '@/types/admin';

export const TIER_COLORS: Record<string, string> = {
  free: '#6B7280',
  pro: '#6366F1',
  pro_plus: '#8B5CF6',
  ultra: '#10B981',
};

export const TIER_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  pro_plus: 'Pro+',
  ultra: 'Ultra',
};

export const chartTooltipStyle = {
  backgroundColor: '#0F172A',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
      <h2 className="text-white/70 text-sm font-semibold uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

interface TimeRangeSelectorProps {
  value: DashboardTimeRange;
  onChange: (value: DashboardTimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const options: DashboardTimeRange[] = ['7d', '30d', '90d'];
  return (
    <div className="flex gap-1">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            value === option
              ? 'bg-indigo-500 text-white'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
