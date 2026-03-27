'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { KnowledgeFileUpload } from '@/features/community-nodes/components/KnowledgeFileUpload';
import { SchemaEditor } from '@/features/community-nodes/components/SchemaEditor';
import {
  COMMUNITY_NODE_CATEGORIES,
  COMMUNITY_NODE_ICON_OPTIONS,
} from '@/features/community-nodes/constants/catalog';
import { publishCommunityNode } from '@/services/community-nodes.service';
import type { CommunityNodeMine, CommunityNodeOutputFormat } from '@/types';

interface PublishNodeDialogProps {
  open: boolean;
  onClose: () => void;
  onPublished: (node: CommunityNodeMine) => void;
}

export function PublishNodeDialog({
  open,
  onClose,
  onPublished,
}: PublishNodeDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [icon, setIcon] = useState('Bot');
  const [prompt, setPrompt] = useState('');
  const [inputHint, setInputHint] = useState('');
  const [outputFormat, setOutputFormat] = useState<CommunityNodeOutputFormat>('markdown');
  const [schemaText, setSchemaText] = useState('');
  const [exampleText, setExampleText] = useState('');
  const [modelPreference, setModelPreference] = useState('auto');
  const [knowledgeFile, setKnowledgeFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);

  const parsedSchema = useMemo(() => {
    if (!schemaText.trim()) {
      return null;
    }
    try {
      return JSON.parse(schemaText) as Record<string, unknown>;
    } catch {
      return null;
    }
  }, [schemaText]);

  if (!open) {
    return null;
  }

  const reset = () => {
    setName('');
    setDescription('');
    setCategory('other');
    setIcon('Bot');
    setPrompt('');
    setInputHint('');
    setOutputFormat('markdown');
    setSchemaText('');
    setExampleText('');
    setModelPreference('auto');
    setKnowledgeFile(null);
    setIsSubmitting(false);
    setIsGeneratingSchema(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !prompt.trim()) {
      toast.error('请先填写完整的名称、描述和 Prompt');
      return;
    }
    if (outputFormat === 'json' && !parsedSchema) {
      toast.error('JSON 输出模式下需要合法的 JSON Schema');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await publishCommunityNode({
        name: name.trim(),
        description: description.trim(),
        icon,
        category: category as typeof COMMUNITY_NODE_CATEGORIES[number]['id'],
        prompt,
        input_hint: inputHint.trim(),
        output_format: outputFormat,
        output_schema: parsedSchema,
        model_preference: modelPreference as 'auto' | 'fast' | 'powerful',
        knowledge_file: knowledgeFile,
      });
      toast.success('共享节点已发布');
      onPublished(created);
      reset();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发布失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">发布我的节点</h3>
            <p className="text-sm text-muted-foreground">Prompt 将被封装，使用者不可见也不可修改。</p>
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            关闭
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">节点名称</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-foreground">分类</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                {COMMUNITY_NODE_CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">描述</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-[84px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm md:col-span-1">
              <span className="font-medium text-foreground">图标</span>
              <select
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                {COMMUNITY_NODE_ICON_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm md:col-span-1">
              <span className="font-medium text-foreground">输出格式</span>
              <select
                value={outputFormat}
                onChange={(event) => setOutputFormat(event.target.value as CommunityNodeOutputFormat)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
              </select>
            </label>
            <label className="space-y-2 text-sm md:col-span-1">
              <span className="font-medium text-foreground">推荐模型</span>
              <select
                value={modelPreference}
                onChange={(event) => setModelPreference(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              >
                <option value="auto">自动</option>
                <option value="fast">快速</option>
                <option value="powerful">强力</option>
              </select>
            </label>
          </div>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">System Prompt</span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              className="min-h-[180px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/40"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-foreground">输入提示</span>
            <input
              value={inputHint}
              onChange={(event) => setInputHint(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
              placeholder="告诉使用者上游应该输入什么"
            />
          </label>

          <KnowledgeFileUpload file={knowledgeFile} onChange={setKnowledgeFile} />

          {outputFormat === 'json' ? (
            <SchemaEditor
              name={name}
              description={description}
              prompt={prompt}
              schemaText={schemaText}
              exampleText={exampleText}
              isGenerating={isGeneratingSchema}
              onSchemaTextChange={setSchemaText}
              onExampleTextChange={setExampleText}
              onGeneratingChange={setIsGeneratingSchema}
              onError={(message) => toast.error(message)}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            className="rounded-lg border border-primary/30 bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '发布中...' : '发布节点'}
          </button>
        </div>
      </div>
    </div>
  );
}
