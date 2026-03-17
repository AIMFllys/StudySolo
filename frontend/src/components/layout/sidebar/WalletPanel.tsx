'use client';

import { Key, CreditCard, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useState, useCallback } from 'react';

/** 模拟数据 — 后端 API 就绪后替换 */
const MOCK_API_KEYS = [
  { id: 'key-1', name: '默认 API Key', prefix: 'sk-solo-...8f3a', createdAt: '2026-02-15' },
];

const MOCK_BILLING = {
  balance: 25.80,
  currency: '¥',
  monthlyUsage: 14.20,
  monthlyLimit: 50.00,
};

function ApiKeyItem({ name, prefix }: { name: string; prefix: string }) {
  const [revealed, setRevealed] = useState(false);

  const toggleReveal = useCallback(() => setRevealed((v) => !v), []);

  return (
    <div className="rounded-xl border border-border/50 bg-black/5 p-3 dark:bg-white/3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{name}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleReveal}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            title={revealed ? '隐藏' : '显示'}
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            title="复制"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
        {revealed ? 'sk-solo-1a2b3c4d5e6f7g8h' : prefix}
      </p>
    </div>
  );
}

export default function WalletPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        {/* API Keys Section */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <Key className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              API 密钥
            </span>
          </div>
          <div className="space-y-2">
            {MOCK_API_KEYS.map((key) => (
              <ApiKeyItem key={key.id} name={key.name} prefix={key.prefix} />
            ))}
          </div>
          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/50 py-2 text-[10px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            + 创建新密钥
          </button>
        </div>

        {/* Billing Section */}
        <div>
          <div className="mb-2 flex items-center gap-1.5 px-1">
            <CreditCard className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              余额与用量
            </span>
          </div>

          <div className="rounded-xl border border-border/50 bg-black/5 p-3 dark:bg-white/3">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-muted-foreground">当前余额</span>
              <span className="text-lg font-semibold text-foreground">
                {MOCK_BILLING.currency}{MOCK_BILLING.balance.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-[10px] text-muted-foreground/60">
              <span>本月已用</span>
              <span>{MOCK_BILLING.currency}{MOCK_BILLING.monthlyUsage.toFixed(2)} / {MOCK_BILLING.currency}{MOCK_BILLING.monthlyLimit.toFixed(2)}</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${(MOCK_BILLING.monthlyUsage / MOCK_BILLING.monthlyLimit) * 100}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary/10 py-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 active:scale-[0.98]"
          >
            <CreditCard className="h-3.5 w-3.5" />
            充值
          </button>

          <a
            href="#"
            className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            查看详细账单
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
