'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SliderCaptcha from '@/components/ui/slider-captcha';
import { sendVerificationCode, register } from '@/services/auth.service';
import { useVerificationCountdown } from '@/hooks/use-verification-countdown';
import { AuthShell } from '@/features/auth/components';

export function RegisterForm() {
  const router = useRouter();
  const countdown = useVerificationCountdown(60);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCaptchaVerified = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function handleSendCode() {
    if (!email) {
      setError('请先输入邮箱地址');
      return;
    }

    if (!captchaToken) {
      setError('请先完成滑块验证');
      return;
    }

    setError('');
    setSendingCode(true);
    try {
      await sendVerificationCode(email, captchaToken);
      setCodeSent(true);
      countdown.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!verificationCode) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, verificationCode, name);
      router.push('/login?registered=true&confirmed=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="创建账号"
      description="开始你的 AI 学习之旅"
      footer={
        <>
          已有账号？{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            立即登录
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-name" className="text-sm font-medium text-white/80">
            姓名
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="你的名字"
            className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-email" className="text-sm font-medium text-white/80">
            邮箱
          </label>
          <input
            id="register-email"
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
          <label className="text-sm font-medium text-white/80">人机验证</label>
          <SliderCaptcha onVerified={handleCaptchaVerified} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-code" className="text-sm font-medium text-white/80">
            邮箱验证码
          </label>
          <div className="flex gap-2">
            <input
              id="register-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6 位验证码"
              className="flex-1 h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition tracking-[4px] text-center font-mono"
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sendingCode || countdown.isActive || !captchaToken}
              className="shrink-0 px-4 h-10 rounded-lg bg-[#1E293B] border border-white/[0.08] text-sm text-white/80 hover:bg-[#334155] hover:border-white/[0.12] disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] whitespace-nowrap"
            >
              {sendingCode ? '发送中...' : countdown.isActive ? `${countdown.secondsLeft}s` : codeSent ? '重新发送' : '发送验证码'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-password" className="text-sm font-medium text-white/80">
            密码
          </label>
          <input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="至少 8 位"
            className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="register-confirm-password" className="text-sm font-medium text-white/80">
            确认密码
          </label>
          <input
            id="register-confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="再次输入密码"
            className="h-10 rounded-lg bg-[#0F172A]/50 border border-white/[0.08] px-3 text-sm text-white placeholder:text-[#94A3B8]/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition"
          />
        </div>

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
          {loading ? '注册中...' : '创建账号'}
        </button>
      </form>
    </AuthShell>
  );
}
