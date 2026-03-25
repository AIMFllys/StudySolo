'use client';

import Link from 'next/link';
import { useAdminSidebarNavigation } from '@/features/admin/hooks/use-admin-sidebar-navigation';

const NAV_ITEMS = [
  { href: '/admin-analysis', label: '控制面板', icon: 'dashboard' },
  { href: '/admin-analysis/users', label: '用户管理', icon: 'group' },
  { href: '/admin-analysis/workflows', label: '工作流', icon: 'account_tree' },
  { href: '/admin-analysis/billing', label: '账单统计', icon: 'payments' },
  { href: '/admin-analysis/audit', label: '审计日志', icon: 'receipt_long' },
  { href: '/admin-analysis/config', label: '系统设置', icon: 'settings' },
];

export function AdminSidebar() {
  const { sidebarOpen, isActive, closeSidebarOnMobileNavigate } =
    useAdminSidebarNavigation();

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={closeSidebarOnMobileNavigate}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-stone-100 border-r border-stone-200/30 transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="px-8 py-6 mb-2">
          <h1 className="font-serif text-2xl font-black text-sky-900 tracking-tight">StudySolo</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500 mt-0.5">
            Management Console
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebarOnMobileNavigate}
                className={`flex items-center px-4 py-3 gap-3 transition-all ${
                  active
                    ? 'text-sky-900 font-bold bg-stone-200/50 border-l-4 border-sky-900'
                    : 'text-stone-500 font-mono text-xs uppercase hover:text-sky-700 border-l-4 border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className={active ? 'font-serif text-sm tracking-wide' : 'text-xs'}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-stone-200/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1A365D] text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-stone-700 truncate">管理员资料</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-tight font-mono">
                系统管理员
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
