'use client';

import { useAdminSidebarNavigation } from '@/features/admin/hooks/use-admin-sidebar-navigation';
import { adminLogout } from '@/services/admin.service';

export function AdminTopbar() {
  const { sidebarOpen, toggleSidebar } = useAdminSidebarNavigation();

  async function handleLogout() {
    try {
      await adminLogout();
    } catch {
      /* allow failure */
    } finally {
      window.location.href = '/admin-analysis/login';
    }
  }

  return (
    <header className="flex justify-between items-center px-8 h-16 w-full sticky top-0 z-50 bg-stone-50/70 backdrop-blur-md shadow-sm shadow-black/5 border-b border-stone-200/20">
      <div className="flex items-center gap-6">
        {/* Mobile toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-stone-500 hover:bg-stone-200/50 transition-colors md:hidden"
          aria-label={sidebarOpen ? '关闭侧边栏' : '打开侧边栏'}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="hidden md:block text-sky-900 font-serif font-bold text-lg tracking-tight">
          StudySolo Admin
        </div>
        <div className="hidden md:block h-4 w-px bg-stone-300" />
        <div className="relative hidden sm:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-stone-400 text-sm">
            search
          </span>
          <input
            className="pl-10 pr-4 py-1.5 bg-transparent border-b border-stone-300 focus:border-[#002045] focus:ring-0 text-sm font-mono transition-all w-64 placeholder:text-stone-400"
            placeholder="搜索管理中心..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-stone-500 hover:bg-stone-200/50 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          onClick={() => void handleLogout()}
          className="p-2 text-stone-500 hover:bg-stone-200/50 transition-colors"
          title="退出登录"
        >
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
