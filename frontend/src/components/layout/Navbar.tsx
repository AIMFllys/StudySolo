'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, logout, type UserInfo } from '@/services/auth.service';
import { useCreateWorkflowAction } from '@/hooks/use-create-workflow-action';

interface NavbarProps {
  onNewWorkflow?: () => Promise<void> | void;
  creating?: boolean;
}

export default function Navbar({ onNewWorkflow, creating = false }: NavbarProps) {
  const router = useRouter();
  const fallbackAction = useCreateWorkflowAction();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getUser().then(setUser).catch(() => null);
  }, []);

  async function handleNewWorkflow() {
    if (onNewWorkflow) {
      await onNewWorkflow();
      return;
    }
    await fallbackAction.createWorkflow();
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  const effectiveCreating = creating || fallbackAction.creating;
  const initials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <header className="glass-panel h-14 flex items-center justify-between px-4 shrink-0 z-10">
      <div className="flex items-center gap-2 select-none">
        <span className="material-symbols-outlined text-xl" style={{ color: '#6366F1' }}>
          bolt
        </span>
        <span
          className="font-bold text-sm tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          StudySolo
        </span>
      </div>

      <div className="hidden sm:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#94A3B8]">
            search
          </span>
          <input
            type="text"
            placeholder="搜索工作流..."
            className="w-full bg-slate-900/50 text-sm text-[#F8FAFC] placeholder-[#94A3B8] rounded-full py-1.5 pl-9 pr-4 border border-white/[0.08] focus:outline-none focus:ring-1 focus:ring-[#6366F1]/50 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => void handleNewWorkflow()}
          disabled={effectiveCreating}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-base leading-none">
            {effectiveCreating ? 'hourglass_empty' : 'add'}
          </span>
          <span>{effectiveCreating ? '创建中' : '新建'}</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold ring-2 ring-transparent hover:ring-primary transition-all overflow-hidden"
            aria-label="用户菜单"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>

          {menuOpen ? (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-20 w-44 rounded-lg glass-card py-1 text-sm">
                {user ? (
                  <div className="px-3 py-2 text-muted-foreground truncate border-b border-white/[0.08] dark:border-white/[0.08] light:border-slate-200 mb-1">
                    {user.email}
                  </div>
                ) : null}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/settings');
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">settings</span>
                  设置
                </button>
                <button
                  onClick={() => void handleLogout()}
                  className="w-full text-left px-3 py-2 hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  退出登录
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
