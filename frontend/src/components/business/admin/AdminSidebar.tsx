'use client';

import Link from 'next/link';
import { X } from 'lucide-react';
import { ADMIN_NAV_ITEMS } from '@/features/admin/shared/constants/admin-nav-items';
import { useAdminSidebarNavigation } from '@/hooks/use-admin-sidebar-navigation';

export default function AdminSidebar() {
  const {
    sidebarOpen,
    toggleSidebar,
    isActive,
    closeSidebarOnMobileNavigate,
  } = useAdminSidebarNavigation();

  return (
    <>
      {sidebarOpen ? (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      ) : null}

      <aside
        className={[
          'fixed left-0 top-0 z-30 flex h-full w-60 flex-col',
          'border-r border-white/10 bg-white/5 backdrop-blur-md',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:static md:z-auto md:translate-x-0',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <span className="text-base font-semibold tracking-wide text-white/90">
            StudySolo Admin
          </span>
          <button
            onClick={toggleSidebar}
            className="text-white/60 transition-colors hover:text-white/90 md:hidden"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_ITEMS.map(({ label, icon: Icon, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeSidebarOnMobileNavigate}
                className={[
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'border border-[#6366F1]/40 bg-[#6366F1]/20 text-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90',
                ].join(' ')}
              >
                <Icon size={18} className={active ? 'text-[#6366F1]' : 'text-white/50'} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
