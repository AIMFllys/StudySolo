'use client'

import { useState, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NoticeType = 'system' | 'feature' | 'maintenance' | 'promotion'
export type NoticeStatus = 'draft' | 'published' | 'archived'

export interface NoticeFormData {
  title: string
  content: string
  type: NoticeType
  status: NoticeStatus
  expires_at: string // ISO string or empty
}

interface NoticeEditorProps {
  initialData?: Partial<NoticeFormData>
  onSubmit: (data: NoticeFormData) => Promise<void>
  submitLabel?: string
  isLoading?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: { value: NoticeType; label: string }[] = [
  { value: 'system',      label: 'System' },
  { value: 'feature',     label: 'Feature' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'promotion',   label: 'Promotion' },
]

const STATUS_OPTIONS: { value: NoticeStatus; label: string }[] = [
  { value: 'draft',     label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived',  label: 'Archived' },
]

// ---------------------------------------------------------------------------
// NoticeEditor component
// ---------------------------------------------------------------------------

export default function NoticeEditor({
  initialData,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
}: NoticeEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [type, setType] = useState<NoticeType>(initialData?.type ?? 'system')
  const [status, setStatus] = useState<NoticeStatus>(initialData?.status ?? 'draft')
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at ?? '')
  const [preview, setPreview] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    else if (title.trim().length > 200) errs.title = 'Title must be ≤ 200 characters'
    if (!content.trim()) errs.content = 'Content is required'
    else if (content.trim().length > 10000) errs.content = 'Content must be ≤ 10,000 characters'
    if (expiresAt) {
      const d = new Date(expiresAt)
      if (isNaN(d.getTime())) errs.expires_at = 'Invalid date'
      else if (d <= new Date()) errs.expires_at = 'Expiry must be in the future'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [title, content, expiresAt])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      expires_at: expiresAt,
    })
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition'
  const errorClass = 'text-red-400 text-xs mt-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notice title…"
          maxLength={200}
          className={inputClass}
        />
        {errors.title && <p className={errorClass}>{errors.title}</p>}
        <p className="text-white/30 text-xs mt-1">{title.length}/200</p>
      </div>

      {/* Type + Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NoticeType)}
            className={inputClass + ' cursor-pointer'}
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0F172A]">{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as NoticeStatus)}
            className={inputClass + ' cursor-pointer'}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#0F172A]">{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expires at */}
      <div>
        <label className="block text-white/60 text-xs font-medium mb-1.5 uppercase tracking-wider">
          Expires At <span className="text-white/30">(optional)</span>
        </label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className={inputClass + ' [color-scheme:dark]'}
        />
        {errors.expires_at && <p className={errorClass}>{errors.expires_at}</p>}
      </div>

      {/* Content with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-white/60 text-xs font-medium uppercase tracking-wider">
            Content <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreview(false)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                !preview ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setPreview(true)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                preview ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>
        </div>

        {preview ? (
          <div className="min-h-[240px] bg-white/5 border border-white/10 rounded-lg px-4 py-3 prose prose-invert prose-sm max-w-none">
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            ) : (
              <p className="text-white/30 italic text-sm">Nothing to preview yet…</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write notice content in Markdown…"
            rows={12}
            maxLength={10000}
            className={inputClass + ' resize-y font-mono text-xs leading-relaxed'}
          />
        )}
        {errors.content && <p className={errorClass}>{errors.content}</p>}
        <p className="text-white/30 text-xs mt-1">{content.length}/10,000</p>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {isLoading ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
