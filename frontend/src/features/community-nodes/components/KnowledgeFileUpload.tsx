'use client';

interface KnowledgeFileUploadProps {
  file: File | null;
  onChange: (file: File | null) => void;
}

export function KnowledgeFileUpload({ file, onChange }: KnowledgeFileUploadProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        知识文件
      </label>
      <label className="flex cursor-pointer flex-col rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5">
        <span>点击上传 PDF / DOCX / MD / TXT，单文件不超过 10MB</span>
        {file ? (
          <span className="mt-2 text-xs text-foreground">
            已选择：{file.name} ({Math.ceil(file.size / 1024)} KB)
          </span>
        ) : null}
        <input
          type="file"
          accept=".pdf,.docx,.md,.txt"
          className="hidden"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
      </label>
      {file ? (
        <button
          type="button"
          className="text-xs text-primary underline"
          onClick={() => onChange(null)}
        >
          清除文件
        </button>
      ) : null}
    </div>
  );
}
