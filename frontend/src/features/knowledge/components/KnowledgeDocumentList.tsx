'use client';

import type { KBDocument } from '../types';
import { FILE_TYPE_ICONS, STATUS_BADGES, formatDate, formatFileSize } from '../utils';

interface KnowledgeDocumentListProps {
  documents: KBDocument[];
  deleteConfirm: string | null;
  onDeleteConfirmChange: (documentId: string | null) => void;
  onDelete: (documentId: string) => void;
}

export function KnowledgeDocumentList({
  documents,
  deleteConfirm,
  onDeleteConfirmChange,
  onDelete,
}: KnowledgeDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-3 text-4xl">📭</div>
        <p className="text-gray-500">知识库还是空的</p>
        <p className="mt-1 text-sm text-gray-400">
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
            className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md"
          >
            <div className="text-2xl flex-shrink-0">{icon}</div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium text-gray-800">{document.filename}</span>
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
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{formatFileSize(document.file_size_bytes)}</span>
                {document.total_chunks > 0 ? <span>{document.total_chunks} 个分块</span> : null}
                {document.total_tokens > 0 ? (
                  <span>{document.total_tokens.toLocaleString()} tokens</span>
                ) : null}
                <span>{formatDate(document.created_at)}</span>
              </div>
              {document.error_message ? (
                <p className="mt-1 truncate text-xs text-red-500">⚠️ {document.error_message}</p>
              ) : null}
            </div>

            {deleteConfirm === document.id ? (
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  onClick={() => onDelete(document.id)}
                  className="rounded bg-red-500 px-2 py-1 text-xs text-white transition-colors hover:bg-red-600"
                >
                  确认删除
                </button>
                <button
                  onClick={() => onDeleteConfirmChange(null)}
                  className="px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-700"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => onDeleteConfirmChange(document.id)}
                className="flex-shrink-0 p-2 text-gray-400 opacity-0 transition-all duration-200 hover:text-red-500 group-hover:opacity-100"
                title="删除文档"
              >
                🗑️
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
