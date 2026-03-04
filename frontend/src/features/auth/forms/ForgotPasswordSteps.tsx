import Link from 'next/link';
import SliderCaptcha from '@/components/ui/slider-captcha';
interface CountdownState {
  secondsLeft: number;
  isActive: boolean;
}

interface StepErrorProps {
  error: string;
}

export function StepError({ error }: StepErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
      {error}
    </p>
  );
}

interface EmailStepProps {
  email: string;
  loading: boolean;
  captchaToken: string;
  error: string;
  onEmailChange: (value: string) => void;
  onCaptchaVerified: (token: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function EmailStep({
  email,
  loading,
  captchaToken,
  error,
  onEmailChange,
  onCaptchaVerified,
  onSubmit,
}: EmailStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-email" className="text-sm font-medium text-white/80">
          邮箱
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          placeholder="you@example.com"
          className="h-10 rounded-lg border border-white/[0.08] bg-[#0F172A]/50 px-3 text-sm text-white placeholder:text-[#94A3B8]/60 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-white/80">人机验证</label>
        <SliderCaptcha onVerified={onCaptchaVerified} />
      </div>

      <StepError error={error} />

      <button
        type="submit"
        disabled={loading || !captchaToken}
        className="mt-1 h-10 rounded-lg bg-primary text-sm font-medium text-white shadow-glow transition-all hover:bg-[#4F46E5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '发送中...' : '发送验证码'}
      </button>
    </form>
  );
}

interface CodeStepProps {
  email: string;
  verificationCode: string;
  loading: boolean;
  error: string;
  countdown: CountdownState;
  onCodeChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onBackToEmail: () => void;
  onResend: () => void;
}

export function CodeStep({
  email,
  verificationCode,
  loading,
  error,
  countdown,
  onCodeChange,
  onSubmit,
  onBackToEmail,
  onResend,
}: CodeStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="rounded-lg border border-primary/10 bg-primary/5 px-3 py-2 text-xs text-[#94A3B8]">
        验证码已发送至 <span className="font-medium text-white">{email}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-code" className="text-sm font-medium text-white/80">
          验证码
        </label>
        <input
          id="forgot-code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          autoFocus
          value={verificationCode}
          onChange={(event) => onCodeChange(event.target.value)}
          placeholder="请输入 6 位验证码"
          className="h-12 rounded-lg border border-white/[0.08] bg-[#0F172A]/50 px-4 text-center font-mono text-lg tracking-[8px] text-white placeholder:text-sm placeholder:tracking-normal placeholder:text-[#94A3B8]/60 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <StepError error={error} />

      <button
        type="submit"
        disabled={verificationCode.length !== 6}
        className="mt-1 h-10 rounded-lg bg-primary text-sm font-medium text-white shadow-glow transition-all hover:bg-[#4F46E5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        下一步
      </button>

      <div className="flex items-center justify-between text-xs text-[#94A3B8]">
        <button type="button" onClick={onBackToEmail} className="text-primary hover:underline">
          更换邮箱
        </button>
        <button
          type="button"
          onClick={onResend}
          disabled={countdown.isActive || loading}
          className="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40"
        >
          {countdown.isActive ? `${countdown.secondsLeft}s 后可重发` : '重新发送验证码'}
        </button>
      </div>
    </form>
  );
}

interface PasswordStepProps {
  password: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}

export function PasswordStep({
  password,
  confirmPassword,
  loading,
  error,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: PasswordStepProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-password" className="text-sm font-medium text-white/80">
          新密码
        </label>
        <input
          id="forgot-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          autoFocus
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          placeholder="至少 8 位"
          className="h-10 rounded-lg border border-white/[0.08] bg-[#0F172A]/50 px-3 text-sm text-white placeholder:text-[#94A3B8]/60 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="forgot-confirm-password" className="text-sm font-medium text-white/80">
          确认新密码
        </label>
        <input
          id="forgot-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="再次输入新密码"
          className="h-10 rounded-lg border border-white/[0.08] bg-[#0F172A]/50 px-3 text-sm text-white placeholder:text-[#94A3B8]/60 transition focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <StepError error={error} />

      <button
        type="submit"
        disabled={loading}
        className="mt-1 h-10 rounded-lg bg-primary text-sm font-medium text-white shadow-glow transition-all hover:bg-[#4F46E5] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? '重置中...' : '重置密码'}
      </button>
    </form>
  );
}

export function ResetSuccess() {
  return (
    <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-4 text-center">
      <div className="mb-3 flex justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
          <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <p className="text-sm font-medium text-green-400">密码重置成功</p>
      <p className="mt-1 text-xs text-[#94A3B8]">请使用新密码登录账号</p>
      <div className="mt-4">
        <Link href="/login" className="font-medium text-primary hover:underline">
          前往登录
        </Link>
      </div>
    </div>
  );
}



