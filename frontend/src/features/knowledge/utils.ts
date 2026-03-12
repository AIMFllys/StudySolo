import type { KnowledgeApiError } from './types';

export const STATUS_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '等待处理', color: '#d97706', bg: '#fef3c7' },
  processing: { label: '处理中...', color: '#2563eb', bg: '#dbeafe' },
  ready: { label: '已就绪', color: '#059669', bg: '#d1fae5' },
  error: { label: '处理失败', color: '#dc2626', bg: '#fee2e2' },
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  md: '📋',
  txt: '📃',
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  const apiError = error as KnowledgeApiError | null;
  if (apiError?.detail) {
    return apiError.detail;
  }
  return fallback;
}
