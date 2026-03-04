'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NoticeEditor, { type NoticeFormData } from '@/components/business/admin/NoticeEditor'
import { adminFetch } from '@/services/admin.service'

export default function CreateNoticePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: NoticeFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      await adminFetch('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          type: data.type,
          status: data.status,
          expires_at: data.expires_at || null,
        }),
      })
      router.push('/admin-analysis/notices')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create notice')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-white/40 hover:text-white transition-colors"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-white text-xl font-bold">New Notice</h1>
          <p className="text-white/40 text-sm mt-0.5">Create a new notice for users</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Editor card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <NoticeEditor
          onSubmit={handleSubmit}
          submitLabel="Create Notice"
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
