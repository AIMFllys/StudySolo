'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resetPassword } from '@/services/auth.service';

/**
 * Legacy reset-password page.
 * Handles Supabase recovery links that include tokens in the URL hash.
 * The new primary flow is via /forgot-password (code-based).
 */
export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokens, setTokens] = useState<{
    access_token: string;
    refresh_token: string;
  } | null>(null);

  // Extract tokens from URL hash fragment (Supabase sends them as hash params)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && refreshToken && type === 'recovery') {
      setTokens({ access_token: accessToken, refresh_token: refreshToken });
      window.history.replaceState(null, '', window.location.pathname);
    } else if (!accessToken) {
      // No tokens in URL — redirect to the new forgot-password flow
      router.replace('/forgot-password');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 8) { setError('密码至少需要 8 位'); return; }
    if (!tokens) { setError('重置链接无效或已过期'); return; }

    setLoading(true);
    try {
      await resetPassword(tokens.access_token, tokens.refresh_token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login?reset=success'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-2xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            bolt
          </span>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-[#818CF8] bg-clip-text text-transparent">
            StudySolo
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">重置密码</h2>
          <p className="text-sm text-[#94A3B8] mt-1">设置你的新密码</p>
        </div>

        {success ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg px-4 py-4 bg-green-500/10 border border-green-500/20 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <p className="text-green-400 text-sm font-medium">密码重置成功！</p>
              <p className="text-[#94A3B8] text-xs mt-1">正在跳转到登录页面...</p>
            </div>
            <Link
              href="/login"
              className="block text-center h-10 leading-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-[#4F46E5] transition-all"
            >
              立即登录
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-white/80">新密码</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 8 位"
                minLength={8}
                disabled={!tokens}
                className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition disabled:opacity-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">确认新密码</label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                minLength={8}
                disabled={!tokens}
                className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !tokens}
              className="mt-1 h-10 rounded-lg bg-primary text-white text-sm font-medium hover:bg-[#4F46E5] shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {loading ? '重置中...' : '重置密码'}
            </button>

            <p className="text-center text-sm text-[#94A3B8]">
              <Link href="/forgot-password" className="text-primary font-medium hover:underline">
                使用验证码重置
              </Link>
              {' · '}
              <Link href="/login" className="text-primary font-medium hover:underline">
                返回登录
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
