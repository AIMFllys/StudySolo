import { createClient } from '@/utils/supabase/client';

const API_BASE = '';

/** Redirect to /login, preserving current path as ?next= */
function redirectToLogin() {
  if (typeof window === 'undefined') return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}`;
}

/** Fetch wrapper that auto-redirects on 401 (skipped for auth endpoints) */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  });
  // Don't redirect on 401 for auth endpoints — let the caller handle the error
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    redirectToLogin();
  }
  return res;
}

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  user: { id: string; email: string; name?: string; avatar_url?: string; role?: string };
}

export interface RegisterResult {
  message: string;
  confirmed: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role?: string;
}

/** Send verification code to email. Requires captcha token. */
export async function sendVerificationCode(
  email: string,
  captchaToken: string,
  codeType: 'register' | 'reset_password' = 'register',
): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, captcha_token: captchaToken, code_type: codeType }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '验证码发送失败，请重试');
  }
  return res.json();
}

/** Login with email + password. Returns user info on success. */
export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '登录失败，请检查邮箱和密码');
  }
  return res.json();
}

/** Register a new account with email verification code. */
export async function register(
  email: string,
  password: string,
  verificationCode: string,
  name?: string,
): Promise<RegisterResult> {
  const res = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      verification_code: verificationCode,
      ...(name ? { name } : {}),
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '注册失败，请重试');
  }
  return res.json();
}

/** Resend email verification link (legacy). */
export async function resendVerification(email: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '发送失败，请重试');
  }
  return res.json();
}

/** Logout — clears both backend HttpOnly cookies and Supabase SSR session. */
export async function logout(): Promise<void> {
  // 1. Clear backend cookies
  await apiFetch('/api/auth/logout', { method: 'POST' });
  // 2. Clear Supabase client session so Next.js middleware also sees logout
  const supabase = createClient();
  await supabase.auth.signOut();
}

/** Request a password reset email. */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '发送失败，请重试');
  }
  return res.json();
}

/** Reset password using recovery tokens from the email link (legacy). */
export async function resetPassword(
  accessToken: string,
  refreshToken: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      refresh_token: refreshToken,
      new_password: newPassword,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '重置失败，请重试');
  }
  return res.json();
}

/** Reset password using email + verification code. */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await apiFetch('/api/auth/reset-password-with-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, new_password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '重置失败，请重试');
  }
  return res.json();
}

/** Get current authenticated user info. */
export async function getUser(): Promise<UserInfo> {
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || '获取用户信息失败');
  }
  return res.json();
}

/**
 * Initialize cross-tab logout sync.
 * Call once at app startup (e.g. in root layout or a client component).
 * Listens for Supabase SIGNED_OUT events and redirects all tabs to /login.
 * Returns an unsubscribe function.
 */
export function initCrossTabSync(): () => void {
  const supabase = createClient();
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      redirectToLogin();
    }
  });
  return () => subscription.unsubscribe();
}
