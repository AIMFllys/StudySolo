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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Countdown timer when account is locked
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
          // Account locked — parse locked_until from body
          const lockedUntilStr = err.body.locked_until as string | undefined
          if (lockedUntilStr) {
            setLockedUntil(new Date(lockedUntilStr))
          } else {
            // Fallback: assume 30 min lock
            setLockedUntil(new Date(Date.now() + 30 * 60 * 1000))
          }
          setError('Account locked.')
        } else {
          setError(err.message)
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Glass card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">StudySolo Admin</h1>
            <p className="text-white/40 text-sm mt-1">Management Console</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading || isLocked}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 transition"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isLocked}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-50 transition"
                placeholder="Enter password"
              />
            </div>

            {/* Error / Lock message */}
            {(error || countdown) && (
              <div className="rounded-lg px-4 py-3 bg-red-500/10 border border-red-500/20">
                {isLocked && countdown ? (
                  <p className="text-orange-400 text-sm">
                    Account locked. Try again in{' '}
                    <span className="font-mono font-semibold">{countdown}</span>
                  </p>
                ) : (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || isLocked || !username || !password}
              className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/30 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
