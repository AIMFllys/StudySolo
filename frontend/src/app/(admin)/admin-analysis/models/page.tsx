'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminFetch } from '@/services/admin.service'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModelConfig {
  model_id: string
  config: Record<string, unknown>
  description: string | null
  updated_at: string | null
}

interface ModelStatusResponse {
  models: ModelConfig[]
}

interface ModelUsageStat {
  model_id: string
  total_tokens: number
  run_count: number
}

interface ModelUsageResponse {
  usage: ModelUsageStat[]
  time_range: string
}

type TimeRange = '7d' | '30d' | '90d'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminModelsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [statusData, setStatusData] = useState<ModelStatusResponse | null>(null)
  const [usageData, setUsageData] = useState<ModelUsageResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [status, usage] = await Promise.all([
        adminFetch<ModelStatusResponse>('/models/status'),
        adminFetch<ModelUsageResponse>(`/models/usage?time_range=${timeRange}`),
      ])
      setStatusData(status)
      setUsageData(usage)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取模型数据失败')
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold">AI Model Management</h1>
          <p className="text-white/40 text-sm mt-0.5">
            {statusData ? `${statusData.models.length} models configured` : 'Loading…'}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
          {(['7d', '30d', '90d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                timeRange === r ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchAll} className="text-red-300 hover:text-red-200 underline text-xs ml-4">Retry</button>
        </div>
      )}

      {/* Usage summary */}
      {usageData && (
        <div className="grid grid-cols-2 gap-4">
          {usageData.usage.map((u) => (
            <div key={u.model_id} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-white/40 text-xs uppercase tracking-wider mb-1">
                {u.model_id === 'all' ? 'Total Token Usage' : u.model_id}
              </p>
              <p className="text-white text-2xl font-bold">{u.total_tokens.toLocaleString()}</p>
              <p className="text-white/40 text-xs mt-0.5">{u.run_count} runs · {timeRange}</p>
            </div>
          ))}
        </div>
      )}

      {/* Model configs table */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h2 className="text-white text-sm font-semibold">Model Configurations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Model ID', 'Description', 'Config', 'Last Updated'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-white/40 text-xs uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 bg-white/10 rounded animate-pulse w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : statusData?.models.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-white/30 text-sm">
                    No model configurations found
                  </td>
                </tr>
              ) : (
                statusData?.models.map((m) => (
                  <tr key={m.model_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs">{m.model_id}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{m.description ?? '—'}</td>
                    <td className="px-4 py-3 text-white/40 font-mono text-xs max-w-xs truncate">
                      {JSON.stringify(m.config)}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs">{formatDate(m.updated_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
