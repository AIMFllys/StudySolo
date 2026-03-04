'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { login } from '@/services/auth.service';
import { AuthShell } from '@/features/auth/components';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/workspace';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const justRegistered = searchParams.get('registered') === 'true';
  const resetSuccess = searchParams.get('reset') === 'success';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });

      toast.success('登录成功', {
        description: '正在进入工作区...',
        duration: 2500,
      });

      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="欢迎回来"
      description="登录你的 StudySolo 账号"
      footer={
        <>
          还没有账号？{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            立即注册
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-white/80">
            邮箱
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-white/80">
            密码
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/[0.15] bg-[#0F172A]/50 text-primary focus:ring-primary/50 focus:ring-offset-0"
            />
            <span className="text-xs text-[#94A3B8]">记住我</span>
          </label>
          <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
            忘记密码？
          </Link>
        </div>

        {justRegistered ? (
          <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
            注册成功，请使用邮箱和密码登录。
          </p>
        ) : null}

        {resetSuccess ? (
          <p className="text-sm text-green-400 bg-green-500/10 rounded-lg px-3 py-2 border border-green-500/20">
            密码已更新，请重新登录。
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-[#4F46E5] shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </AuthShell>
  );
}
