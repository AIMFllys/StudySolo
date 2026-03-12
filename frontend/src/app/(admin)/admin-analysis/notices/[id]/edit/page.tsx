'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import NoticeEditor, { type NoticeFormData, type NoticeType, type NoticeStatus } from '@/features/admin/notices/NoticeEditor'
import { adminFetch } from '@/services/admin.service'

interface NoticeDetail {
  id: string
  title: string
  content: string
  type: string
  status: string
  expires_at: string | null
  created_at: string
  published_at: string | null
  read_count: number
}

export default function EditNoticePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const noticeId = params.id

  const [notice, setNotice] = useState<NoticeDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!noticeId) return
    adminFetch<NoticeDetail>(`/notices/${noticeId}`)
      .then(setNotice)
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to load notice')
      })
  }, [noticeId])

  const handleSubmit = async (data: NoticeFormData) => {
    if (!noticeId) return
    setIsLoading(true)
    setSaveError(null)
    try {
      await adminFetch(`/notices/${noticeId}`, {
        method: 'PUT',
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
      setSaveError(err instanceof Error ? err.message : 'Failed to save notice')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading skeleton
  if (!notice && !loadError) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-white/10 rounded animate-pulse" />
          ))}
          <div className="h-40 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    )
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
          <h1 className="text-white text-xl font-bold">Edit Notice</h1>
          {notice && (
            <p className="text-white/40 text-sm mt-0.5">
              {notice.read_count.toLocaleString()} reads
            </p>
          )}
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {loadError}
        </div>
      )}

      {/* Save error */}
      {saveError && (
        <div className="rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      {/* Editor card */}
      {notice && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <NoticeEditor
            initialData={{
              title: notice.title,
              content: notice.content,
              type: notice.type as NoticeType,
              status: notice.status as NoticeStatus,
              expires_at: notice.expires_at
                ? new Date(notice.expires_at).toISOString().slice(0, 16)
                : '',
            }}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  )
}
