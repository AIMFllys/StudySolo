'use client';

import { Activity, ArrowUpRight, ArrowDownRight, Zap, Timer, BarChart3 } from 'lucide-react';

/** 模拟数据 — 后端 API 就绪后替换 */
const MOCK_STATS = {
  totalRuns: 47,
  successRate: 91.5,
  avgDuration: '2m 18s',
  tokensUsed: 128400,
  tokensLimit: 500000,
  runsToday: 5,
  runsTrend: 12, // positive = up
};

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  subtext,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  trend?: number;
  subtext?: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-black/5 p-3 dark:bg-white/3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-[10px] font-medium ${
              trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend >= 0 ? (
              <ArrowUpRight className="h-2.5 w-2.5" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{value}</p>
      {subtext ? <p className="mt-0.5 text-[10px] text-muted-foreground/60">{subtext}</p> : null}
    </div>
  );
}

function UsageBar({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = Math.min(100, (used / total) * 100);
  return (
    <div className="rounded-xl border border-border/50 bg-black/5 p-3 dark:bg-white/3">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{label}</span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground/60">
        {used.toLocaleString()} / {total.toLocaleString()}
      </p>
    </div>
  );
}

export default function DashboardPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-3 px-1 text-[10px] text-muted-foreground">
          实时统计你的工作流运行情况与配额使用
        </p>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Activity}
            label="总运行"
            value={MOCK_STATS.totalRuns}
            trend={MOCK_STATS.runsTrend}
          />
          <StatCard
            icon={BarChart3}
            label="成功率"
            value={`${MOCK_STATS.successRate}%`}
          />
          <StatCard
            icon={Timer}
            label="平均耗时"
            value={MOCK_STATS.avgDuration}
          />
          <StatCard
            icon={Zap}
            label="今日运行"
            value={MOCK_STATS.runsToday}
            subtext="较昨日 +2"
          />
        </div>

        <div className="mt-3 space-y-2">
          <UsageBar
            used={MOCK_STATS.tokensUsed}
            total={MOCK_STATS.tokensLimit}
            label="Token 用量"
          />
        </div>
      </div>
    </div>
  );
}
