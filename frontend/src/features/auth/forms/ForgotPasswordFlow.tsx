'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { sendVerificationCode, resetPasswordWithCode } from '@/services/auth.service';
import { useVerificationCountdown } from '@/hooks/use-verification-countdown';
import { AuthShell } from '@/features/auth/components';
import {
  CodeStep,
  EmailStep,
  PasswordStep,
  ResetSuccess,
} from './ForgotPasswordSteps';

type Step = 'email' | 'code' | 'password' | 'success';

export function ForgotPasswordFlow() {
  const countdown = useVerificationCountdown(60);

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCaptchaVerified = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  async function sendCode() {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    if (!captchaToken) {
      setError('请先完成滑块验证');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await sendVerificationCode(email, captchaToken, 'reset_password');
      countdown.start();
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (countdown.isActive || !captchaToken) {
      return;
    }

    setError('');
    setLoading(true);
    try {
      await sendVerificationCode(email, captchaToken, 'reset_password');
      countdown.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败');
    } finally {
      setLoading(false);
    }
  }

  function handleCodeSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (verificationCode.length !== 6) {
      setError('请输入 6 位验证码');
      return;
    }

    setError('');
    setStep('password');
  }

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('密码至少 8 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithCode(email, verificationCode, password);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="找回密码"
      description="通过邮箱验证码重置你的登录密码"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          {step === 'success' ? '前往登录' : '返回登录'}
        </Link>
      }
      showSocial={false}
    >
      {step === 'email' ? (
        <EmailStep
          email={email}
          loading={loading}
          captchaToken={captchaToken}
          error={error}
          onEmailChange={setEmail}
          onCaptchaVerified={handleCaptchaVerified}
          onSubmit={(event) => {
            event.preventDefault();
            void sendCode();
          }}
        />
      ) : null}

      {step === 'code' ? (
        <CodeStep
          email={email}
          verificationCode={verificationCode}
          loading={loading}
          error={error}
          countdown={countdown}
          onCodeChange={(value) => setVerificationCode(value.replace(/\D/g, '').slice(0, 6))}
          onSubmit={handleCodeSubmit}
          onBackToEmail={() => {
            setStep('email');
            setError('');
          }}
          onResend={() => {
            void resendCode();
          }}
        />
      ) : null}

      {step === 'password' ? (
        <PasswordStep
          password={password}
          confirmPassword={confirmPassword}
          loading={loading}
          error={error}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleResetPassword}
        />
      ) : null}

      {step === 'success' ? <ResetSuccess /> : null}
    </AuthShell>
  );
}
