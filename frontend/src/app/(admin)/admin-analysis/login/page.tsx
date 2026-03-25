'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { adminLogin, AdminApiError } from '@/services/admin.service'
import { useAdminStore } from '@/stores/use-admin-store'

export default function AdminLoginPage() {
  const router = useRouter()
  const { setAdmin } = useAdminStore()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Countdown timer when account is locked ──
  useEffect(() => {
    if (!lockedUntil) {
      setCountdown(null)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const tick = () => {
      const diff = lockedUntil.getTime() - Date.now()
      if (diff <= 0) {
        setLockedUntil(null)
        setCountdown(null)
        setError(null)
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      const totalSeconds = Math.ceil(diff / 1000)
      const mins = Math.floor(totalSeconds / 60)
      const secs = totalSeconds % 60
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [lockedUntil])

  const isLocked = lockedUntil !== null && lockedUntil.getTime() > Date.now()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || loading) return

    setLoading(true)
    setError(null)

    try {
      const data = await adminLogin(username, password)
      setAdmin(data.admin)

      if (data.admin.force_change_password) {
        router.push('/admin-analysis/change-password')
      } else {
        router.push('/admin-analysis')
      }
    } catch (err: unknown) {
      if (err instanceof AdminApiError) {
        if (err.status === 423) {
          const lockedUntilStr = err.body.locked_until as string | undefined
          if (lockedUntilStr) {
            setLockedUntil(new Date(lockedUntilStr))
          } else {
            setLockedUntil(new Date(Date.now() + 30 * 60 * 1000))
          }
          setError('账户已锁定')
        } else {
          setError(err.message)
        }
      } else {
        setError('发生未知错误，请重试。')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col academic-grid overflow-hidden font-[Work_Sans,sans-serif]">
      {/* ── Top Header ── */}
      <header className="bg-[#FAF9F5] border-b border-[#002045]/10 flex justify-between items-center w-full px-8 py-4 z-50">
        <div className="flex items-center gap-4">
          <span className="font-serif font-bold text-2xl tracking-tight text-[#002045] border-b-2 border-[#002045]">
            StudySolo
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-400 mt-2 px-2 border-l border-[#c4c6cf]/30">
            Admin Node v2.0
          </span>
        </div>
        <nav className="hidden md:flex gap-8">
          <a className="text-[#002045] font-bold border-b-2 border-[#002045] hover:bg-[#002045]/5 transition-colors px-2 py-1" href="#">
            登录
          </a>
          <a className="text-slate-500 font-mono text-sm hover:bg-[#002045]/5 transition-colors px-2 py-1" href="#">
            技术支持
          </a>
        </nav>
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-[#002045] p-2 hover:bg-[#002045]/5 transition-colors">
            help_outline
          </button>
          <button className="material-symbols-outlined text-[#002045] p-2 hover:bg-[#002045]/5 transition-colors">
            settings
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-grow flex flex-row relative">
        {/* ── Left: Brand Visual Area ── */}
        <section className="hidden lg:flex w-7/12 flex-col justify-center px-20 relative overflow-hidden border-r border-[#c4c6cf]/10">
          {/* Hatched background */}
          <div className="absolute inset-0 hatched-bg -z-10" />

          <div className="space-y-12 max-w-2xl">
            {/* Mathematical Logo */}
            <div className="relative w-32 h-32 border-2 border-[#002045] p-4">
              <div className="absolute top-0 right-0 w-8 h-8 border-b-2 border-l-2 border-[#002045]" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-t-2 border-r-2 border-[#002045]" />
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-serif text-5xl font-bold italic text-[#002045]">S</span>
              </div>
              <div className="absolute -right-16 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#002045]/40 rotate-90 tracking-[0.5em]">
                PRECISION
              </div>
            </div>

            {/* Hero Copy */}
            <div className="space-y-6">
              <h1 className="font-serif text-6xl font-bold text-[#002045] leading-tight tracking-tighter">
                数据主权<br />
                <span className="italic text-[#1A365D]">学术自由的基础</span>
              </h1>
              <p className="text-xl text-[#43474e] leading-relaxed opacity-80 border-l-4 border-[#002045] pl-6">
                StudySolo 不仅仅是一个管理后台。它是一个受数字主权保护的知识堡垒，致力于保障全球学术研究的私密性与独立性。
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="border-t border-[#c4c6cf]/30 pt-4">
                <span className="font-mono text-xs text-[#002045] uppercase block mb-2">安全协议</span>
                <p className="font-mono text-sm">AES-256 E2EE Standard</p>
              </div>
              <div className="border-t border-[#c4c6cf]/30 pt-4">
                <span className="font-mono text-xs text-[#002045] uppercase block mb-2">访问权限</span>
                <p className="font-mono text-sm">Restricted Academic Node</p>
              </div>
            </div>
          </div>

          {/* Decorative Blueprint Lines */}
          <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none">
            <svg className="text-[#002045]" fill="none" height="400" stroke="currentColor" viewBox="0 0 400 400" width="400">
              <circle cx="200" cy="200" r="150" strokeDasharray="4 4" />
              <rect height="300" strokeWidth="0.5" width="300" x="50" y="50" />
              <line strokeWidth="0.5" x1="0" x2="400" y1="0" y2="400" />
              <line strokeWidth="0.5" x1="400" x2="0" y1="0" y2="400" />
            </svg>
          </div>
        </section>

        {/* ── Right: Login Form ── */}
        <section className="w-full lg:w-5/12 flex flex-col justify-center items-center px-8 lg:px-20 bg-[#FAF9F5] relative">
          <div className="w-full max-w-md space-y-10">
            {/* Form Header */}
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#002045]/60 tracking-[0.2em] uppercase">
                身份验证管理单元
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#002045]">访问授权登录</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Input Field: Account */}
              <div className="space-y-2 group">
                <label
                  htmlFor="username"
                  className="font-mono text-xs text-[#002045]/60 uppercase group-focus-within:text-[#002045] transition-colors"
                >
                  Academic ID / 账号
                </label>
                <div className="relative">
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading || isLocked}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-[#c4c6cf] focus:ring-0 focus:border-[#002045] px-0 py-3 text-lg transition-all placeholder:text-[#74777f]/40 disabled:opacity-50"
                    placeholder="输入您的研究员编号"
                  />
                  <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[#74777f]/40">
                    person_search
                  </span>
                </div>
              </div>

              {/* Input Field: Password */}
              <div className="space-y-2 group">
                <label
                  htmlFor="password"
                  className="font-mono text-xs text-[#002045]/60 uppercase group-focus-within:text-[#002045] transition-colors"
                >
                  Cipher Key / 密码
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading || isLocked}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-[#c4c6cf] focus:ring-0 focus:border-[#002045] px-0 py-3 font-mono text-lg tracking-[0.3em] transition-all placeholder:text-[#74777f]/40 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-[#74777f]/40 hover:text-[#002045] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? 'visibility' : 'key'}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group/check">
                  <input
                    className="w-4 h-4 rounded-none border-[#002045] text-[#002045] focus:ring-offset-0 focus:ring-[#002045]"
                    type="checkbox"
                  />
                  <span className="font-mono text-xs text-[#43474e] group-hover/check:text-[#002045] transition-colors">
                    保持活跃会话
                  </span>
                </label>
                <a
                  className="font-mono text-xs text-[#43474e] hover:text-[#002045] underline decoration-[#002045]/30 underline-offset-4"
                  href="#"
                >
                  忘记凭证?
                </a>
              </div>

              {/* Error / Lock message */}
              {(error || countdown) && (
                <div className="border-l-4 border-red-500 bg-red-50 px-4 py-3">
                  {isLocked && countdown ? (
                    <p className="text-red-700 text-sm font-mono">
                      账户已锁定 — 请在{' '}
                      <span className="font-bold">{countdown}</span>{' '}后重试
                    </p>
                  ) : (
                    <p className="text-red-700 text-sm">{error}</p>
                  )}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading || isLocked || !username || !password}
                className="w-full group relative overflow-hidden bg-[#002045] text-white py-5 px-8 flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-serif font-bold text-lg tracking-wide relative z-10">
                  {loading ? '验证中...' : '执行授权访问'}
                </span>
                <div className="flex items-center gap-2 relative z-10">
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    fingerprint
                  </span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                    arrow_forward_ios
                  </span>
                </div>
                {/* Button Texture Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#002045] to-[#1A365D] opacity-50 mix-blend-overlay" />
              </button>
            </form>

            {/* Bottom Legal */}
            <div className="pt-8 text-center space-y-4">
              <p className="font-mono text-[10px] text-[#74777f] leading-relaxed uppercase tracking-[0.15em]">
                本系统受国际数字版权保护法约束<br />
                未经授权的访问尝试将被永久记录并追溯
              </p>
              <div className="flex justify-center gap-4">
                <div className="w-1 h-1 bg-[#c4c6cf] rounded-full" />
                <div className="w-1 h-1 bg-[#c4c6cf] rounded-full" />
                <div className="w-1 h-1 bg-[#c4c6cf] rounded-full" />
              </div>
            </div>
          </div>

          {/* Node Status Card */}
          <div className="absolute bottom-8 right-8 bg-white/80 backdrop-blur-2xl border border-[#c4c6cf]/15 p-4 flex items-center gap-3 border-l-4 border-l-[#002045]">
            <span className="material-symbols-outlined text-[#002045] text-2xl">shield</span>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-[#002045] font-bold">NODE STATUS</span>
              <span className="font-mono text-[10px] text-emerald-600">ENCRYPTED &amp; ONLINE</span>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-transparent flex justify-center items-center gap-8 py-6 w-full z-50">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400">
          © 2024 StudySolo 管理系统 | 学术访问授权限制
        </span>
        <div className="flex gap-6">
          <a className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 hover:text-[#002045] transition-colors" href="#">
            隐私政策
          </a>
          <a className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 hover:text-[#002045] transition-colors" href="#">
            使用条款
          </a>
          <a className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-400 hover:text-[#002045] transition-colors" href="#">
            安全审计
          </a>
        </div>
      </footer>
    </div>
  )
}
