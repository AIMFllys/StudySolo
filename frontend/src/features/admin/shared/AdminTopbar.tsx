'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/stores/admin/use-admin-store';
import { ADMIN_NAV_ITEMS } from './AdminSidebar';

function resolvePageMeta(pathname: string) {
  const match = ADMIN_NAV_ITEMS.find((item) => {
    if (item.href === '/admin-analysis') return pathname === '/admin-analysis';
    return pathname.startsWith(item.href);
  });
  return match ?? { label: '后台', icon: 'dashboard' };
}

export function AdminTopbar() {
  const pathname = usePathname();
  const admin = useAdminStore((state) => state.admin);
  const page = useMemo(() => resolvePageMeta(pathname), [pathname]);

  return (
    <header className="flex h-12 w-full shrink-0 items-center justify-between border-b border-border/40 bg-card/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-2.5 text-[13px]">
        <span className="font-medium text-muted-foreground/60 scholarly-label !tracking-normal">管理后台</span>
        <span className="text-border/40 select-none">/</span>
        <span className="font-semibold text-foreground tracking-tight">{page.label}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/40 border border-border/30">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-foreground/80">{admin?.username ?? '管理员'}</span>
        </div>
      </div>
    </header>
  );
}
