'use client';

import { useMemo } from 'react';

import { generateCommunityNodeSchema } from '@/services/community-nodes.service';

interface SchemaEditorProps {
  name: string;
  description: string;
  prompt: string;
  schemaText: string;
  exampleText: string;
  isGenerating: boolean;
  onSchemaTextChange: (value: string) => void;
  onExampleTextChange: (value: string) => void;
  onGeneratingChange: (value: boolean) => void;
  onError: (message: string) => void;
}

export function SchemaEditor({
  name,
  description,
  prompt,
  schemaText,
  exampleText,
  isGenerating,
  onSchemaTextChange,
  onExampleTextChange,
  onGeneratingChange,
  onError,
}: SchemaEditorProps) {
  const validation = useMemo(() => {
    if (!schemaText.trim()) {
      return { valid: false, message: '请填写 JSON Schema' };
    }
    try {
      const parsed = JSON.parse(schemaText) as Record<string, unknown>;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { valid: false, message: 'Schema 必须是 JSON 对象' };
      }
      return { valid: true, message: 'JSON Schema 格式合法' };
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Schema 解析失败',
      };
    }
  }, [schemaText]);

  const handleGenerate = async () => {
    onGeneratingChange(true);
    try {
      const result = await generateCommunityNodeSchema({
        name,
        description,
        prompt_snippet: prompt.slice(0, 500),
      });
      onSchemaTextChange(JSON.stringify(result.schema, null, 2));
      onExampleTextChange(JSON.stringify(result.example, null, 2));
    } catch (error) {
      onError(error instanceof Error ? error.message : '生成 Schema 失败');
    } finally {
      onGeneratingChange(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-foreground">JSON Schema</h4>
          <p className="text-xs text-muted-foreground">JSON 输出模式下必须提供结构约束。</p>
        </div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={isGenerating || !name.trim() || !prompt.trim()}
          className="rounded-lg border border-border px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? '生成中...' : 'AI 生成'}
        </button>
      </div>

      <textarea
        value={schemaText}
        onChange={(event) => onSchemaTextChange(event.target.value)}
        placeholder='{\n  "type": "object",\n  "properties": {}\n}'
        className="min-h-[180px] w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-xs text-foreground outline-none focus:border-primary/40"
      />

      <div className={`text-xs ${validation.valid ? 'text-emerald-600' : 'text-amber-600'}`}>
        {validation.valid ? '校验通过：' : '校验提示：'}
        {validation.message}
      </div>

      <textarea
        value={exampleText}
        onChange={(event) => onExampleTextChange(event.target.value)}
        placeholder='{"example": "可选示例"}'
        className="min-h-[100px] w-full rounded-lg border border-border bg-background px-3 py-3 font-mono text-xs text-foreground outline-none focus:border-primary/40"
      />
    </div>
  );
}
