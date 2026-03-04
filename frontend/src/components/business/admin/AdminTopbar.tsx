'use client';

import { Menu, LogOut } from 'lucide-react';
import { useAdminStore } from '@/stores/use-admin-store';
import { useAdminLogoutAction } from '@/hooks/use-admin-logout-action';

export default function AdminTopbar() {
  const admin = useAdminStore((state) => state.admin);
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);
  const { loggingOut, logout } = useAdminLogoutAction();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-white/5 px-4 backdrop-blur-md">
      <button
        onClick={toggleSidebar}
        className="p-1 text-white/60 transition-colors hover:text-white/90 md:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        {admin?.username ? (
          <span className="hidden text-sm text-white/60 sm:block">{admin.username}</span>
        ) : null}
        <button
          onClick={() => {
            void logout();
          }}
          disabled={loggingOut}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Logout"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{loggingOut ? 'Signing out...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
