'use client';

import { useEffect, useMemo, useState } from 'react';
import { authedFetch, parseApiError } from '@/services/api-client';
import { KnowledgeDocumentList } from '@/features/knowledge/components/KnowledgeDocumentList';
import { KnowledgeUploadCard } from '@/features/knowledge/components/KnowledgeUploadCard';
import { useKnowledgeDocuments } from '@/features/knowledge/hooks/use-knowledge-documents';

interface KnowledgeDocumentDetail {
  document: {
    id: string;
    filename: string;
    status: string;
    total_chunks?: number;
    total_tokens?: number;
  };
  summary?: {
    summary?: string;
    key_concepts?: string[];
    table_of_contents?: string[];
  } | null;
  chunk_preview?: Array<{
    chunk_index: number;
    content: string;
  }>;
}

export function KnowledgeNodeLibrary() {
  const {
    documents,
    loading,
    uploading,
    dragOver,
    error,
    deleteConfirm,
    setDragOver,
    setDeleteConfirm,
    clearError,
    refreshDocuments,
    handleDrop,
    handleFileInput,
    handleDelete,
  } = useKnowledgeDocuments();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [detail, setDetail] = useState<KnowledgeDocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDocumentId && documents.some((document) => document.id === selectedDocumentId)) {
      return;
    }
    if (documents.length > 0) {
      setSelectedDocumentId(documents[0].id);
    } else {
      setSelectedDocumentId(null);
    }
  }, [documents, selectedDocumentId]);

  useEffect(() => {
    if (!selectedDocumentId) {
      setDetail(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const response = await authedFetch(`/api/knowledge/${selectedDocumentId}`);
        if (!response.ok) {
          throw new Error(await parseApiError(response, '加载文档详情失败'));
        }
        const data = (await response.json()) as KnowledgeDocumentDetail;
        if (!cancelled) {
          setDetail(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetailError(loadError instanceof Error ? loadError.message : '加载文档详情失败');
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId, documents]);

  const conceptPreview = useMemo(
    () => (detail?.summary?.key_concepts ?? []).slice(0, 6),
    [detail],
  );

  return (
    <section className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-foreground">知识库文件</h3>
          <button
            type="button"
            onClick={() => void refreshDocuments()}
            className="text-xs text-primary underline"
          >
            刷新
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          旧知识库页面已退役。请在这里上传文件，并在执行时由知识库节点直接检索。
        </p>
      </div>

      <KnowledgeUploadCard
        dragOver={dragOver}
        uploading={uploading}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onFileInput={handleFileInput}
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
          <button type="button" onClick={clearError} className="ml-2 underline">
            清除
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">加载知识库中...</div>
      ) : (
        <KnowledgeDocumentList
          documents={documents}
          deleteConfirm={deleteConfirm}
          onDeleteConfirmChange={setDeleteConfirm}
          onDelete={handleDelete}
          onSelect={setSelectedDocumentId}
          selectedDocumentId={selectedDocumentId}
        />
      )}

      <div className="rounded-lg border border-dashed border-border bg-background/70 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            文档摘要
          </span>
          {detail?.document ? (
            <span className="text-[11px] text-muted-foreground">
              {detail.document.filename}
            </span>
          ) : null}
        </div>

        {detailLoading ? (
          <div className="text-sm text-muted-foreground">正在加载文档详情...</div>
        ) : detailError ? (
          <div className="text-sm text-destructive">{detailError}</div>
        ) : !detail ? (
          <div className="text-sm text-muted-foreground">选择一个文档以查看摘要和分块预览。</div>
        ) : (
          <div className="space-y-3 text-sm text-foreground">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span>状态：{detail.document.status}</span>
              {detail.document.total_chunks ? <span>{detail.document.total_chunks} 个分块</span> : null}
              {detail.document.total_tokens ? <span>{detail.document.total_tokens} tokens</span> : null}
            </div>

            {detail.summary?.summary ? (
              <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm leading-6">
                {detail.summary.summary}
              </p>
            ) : (
              <p className="text-muted-foreground">当前文档还没有可展示的摘要。</p>
            )}

            {conceptPreview.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {conceptPreview.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] text-primary"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            ) : null}

            {(detail.chunk_preview ?? []).length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground">分块预览</div>
                {(detail.chunk_preview ?? []).slice(0, 2).map((chunk) => (
                  <div key={chunk.chunk_index} className="rounded-lg border border-border/60 bg-muted/20 p-2 text-xs leading-5 text-muted-foreground">
                    <span className="mb-1 block font-medium text-foreground">Chunk {chunk.chunk_index + 1}</span>
                    {chunk.content.slice(0, 220)}
                    {chunk.content.length > 220 ? '…' : ''}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
