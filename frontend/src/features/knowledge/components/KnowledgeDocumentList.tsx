'use client';

import type { KBDocument } from '../types';
import { FILE_TYPE_ICONS, STATUS_BADGES, formatDate, formatFileSize } from '../utils';

interface KnowledgeDocumentListProps {
  documents: KBDocument[];
  deleteConfirm: string | null;
  onDeleteConfirmChange: (documentId: string | null) => void;
  onDelete: (documentId: string) => void;
  onSelect?: (documentId: string) => void;
  selectedDocumentId?: string | null;
  showDelete?: boolean;
}

export function KnowledgeDocumentList({
  documents,
  deleteConfirm,
  onDeleteConfirmChange,
  onDelete,
  onSelect,
  selectedDocumentId = null,
  showDelete = true,
}: KnowledgeDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-3 text-4xl">📭</div>
        <p className="text-muted-foreground">知识库还是空的</p>
        <p className="mt-1 text-sm text-muted-foreground">
          上传你的学习资料，在工作流中通过知识库节点使用
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const statusBadge = STATUS_BADGES[document.status] ?? STATUS_BADGES.pending;
        const icon = FILE_TYPE_ICONS[document.file_type] ?? '📄';

        return (
          <div
            key={document.id}
            className={`group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md ${
              selectedDocumentId === document.id ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'
            } ${onSelect ? 'cursor-pointer' : ''}`}
            onClick={() => onSelect?.(document.id)}
          >
            <div className="text-2xl flex-shrink-0">{icon}</div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-foreground">{document.filename}</span>
                <span
                  className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color,
                  }}
                >
                  {statusBadge.label}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatFileSize(document.file_size_bytes)}</span>
                {document.total_chunks > 0 ? <span>{document.total_chunks} 个分块</span> : null}
                {document.total_tokens > 0 ? (
                  <span>{document.total_tokens.toLocaleString()} tokens</span>
                ) : null}
                <span>{formatDate(document.created_at)}</span>
              </div>
              {document.error_message ? (
                <p className="mt-1 truncate text-xs text-destructive">⚠️ {document.error_message}</p>
              ) : null}
            </div>

            {showDelete && deleteConfirm === document.id ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(document.id);
                  }}
                  className="rounded bg-destructive px-2 py-1 text-xs text-white transition-colors hover:bg-destructive/90"
                >
                  确认删除
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteConfirmChange(null);
                  }}
                  className="px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  取消
                </button>
              </div>
            ) : showDelete ? (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDeleteConfirmChange(document.id);
                }}
                className="flex-shrink-0 p-2 text-muted-foreground opacity-0 transition-all duration-200 hover:text-destructive group-hover:opacity-100"
                title="删除文档"
              >
                🗑️
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
