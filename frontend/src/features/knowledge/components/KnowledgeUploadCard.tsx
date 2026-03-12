'use client';

interface KnowledgeUploadCardProps {
  dragOver: boolean;
  uploading: boolean;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onFileInput: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function KnowledgeUploadCard({
  dragOver,
  uploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
}: KnowledgeUploadCardProps) {
  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        dragOver
          ? 'border-indigo-400 bg-indigo-50'
          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {uploading ? (
        <div className="space-y-2">
          <div className="text-2xl animate-pulse">⏳</div>
          <p className="text-sm text-gray-600">正在上传和处理文档...</p>
          <p className="text-xs text-gray-400">这可能需要几分钟</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-3xl">📂</div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              拖拽文件到这里，或{' '}
              <label className="cursor-pointer text-indigo-600 underline hover:text-indigo-700">
                点击上传
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.md,.txt"
                  onChange={onFileInput}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              支持 PDF、DOCX、Markdown、TXT 格式，最大 10MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
