'use client';

import { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type NoticeType = 'system' | 'feature' | 'promotion' | 'education' | 'changelog' | 'maintenance';
export type NoticeStatus = 'draft' | 'published' | 'archived';

export interface NoticeFormData {
  title: string;
  content: string;
  type: NoticeType;
  status: NoticeStatus;
  expires_at: string;
}

interface NoticeEditorProps {
  initialData?: Partial<NoticeFormData>;
  onSubmit: (data: NoticeFormData) => Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
}

const TYPE_OPTIONS: { value: NoticeType; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'feature', label: 'Feature' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'education', label: 'Education' },
  { value: 'changelog', label: 'Changelog' },
  { value: 'maintenance', label: 'Maintenance' },
];

const STATUS_OPTIONS: { value: NoticeStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export default function NoticeEditor({
  initialData,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
}: NoticeEditorProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [type, setType] = useState<NoticeType>(initialData?.type ?? 'system');
  const [status, setStatus] = useState<NoticeStatus>(initialData?.status ?? 'draft');
  const [expiresAt, setExpiresAt] = useState(initialData?.expires_at ?? '');
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = 'Title is required';
    else if (title.trim().length > 200) nextErrors.title = 'Title must be ≤ 200 characters';
    if (!content.trim()) nextErrors.content = 'Content is required';
    else if (content.trim().length > 10000) nextErrors.content = 'Content must be ≤ 10,000 characters';
    if (expiresAt) {
      const date = new Date(expiresAt);
      if (Number.isNaN(date.getTime())) nextErrors.expires_at = 'Invalid date';
      else if (date <= new Date()) nextErrors.expires_at = 'Expiry must be in the future';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [content, expiresAt, title]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      type,
      status,
      expires_at: expiresAt,
    });
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition';
  const errorClass = 'mt-1 text-xs text-red-400';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">
          Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Notice title…"
          maxLength={200}
          className={inputClass}
        />
        {errors.title ? <p className={errorClass}>{errors.title}</p> : null}
        <p className="mt-1 text-xs text-white/30">{title.length}/200</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">Type</label>
          <select value={type} onChange={(event) => setType(event.target.value as NoticeType)} className={inputClass}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0F172A]">
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">Status</label>
          <select value={status} onChange={(event) => setStatus(event.target.value as NoticeStatus)} className={inputClass}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#0F172A]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/60">Expires At</label>
        <input
          type="datetime-local"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          className={inputClass}
        />
        {errors.expires_at ? <p className={errorClass}>{errors.expires_at}</p> : null}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-medium uppercase tracking-wider text-white/60">
            Content <span className="text-red-400">*</span>
          </label>
          <button
            type="button"
            onClick={() => setPreview((value) => !value)}
            className="text-xs text-indigo-400 transition-colors hover:text-indigo-300"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div className="prose prose-invert min-h-[300px] rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
            {content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-white/30">Nothing to preview.</p>}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write your notice in Markdown..."
            rows={14}
            className={`${inputClass} min-h-[300px] resize-y py-3`}
          />
        )}
        {errors.content ? <p className={errorClass}>{errors.content}</p> : null}
        <p className="mt-1 text-xs text-white/30">{content.length}/10000</p>
      </div>

      <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
