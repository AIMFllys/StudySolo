'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { SchemaEditor } from '@/features/community-nodes/components/SchemaEditor';
import {
  COMMUNITY_NODE_CATEGORIES,
  COMMUNITY_NODE_ICON_OPTIONS,
} from '@/features/community-nodes/constants/catalog';
import { formatFileSize } from '@/features/knowledge/utils';
import {
  deleteCommunityNode,
  getMyCommunityNode,
  updateCommunityNode,
} from '@/services/community-nodes.service';
import type {
  CommunityNodeCategory,
  CommunityNodeMine,
  CommunityNodeModelPreference,
  CommunityNodeOutputFormat,
} from '@/types';

interface CommunityNodeManagePageProps {
  nodeId: string;
}

export function CommunityNodeManagePage({
  nodeId,
}: CommunityNodeManagePageProps) {
  const router = useRouter();
  const [node, setNode] = useState<CommunityNodeMine | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    void getMyCommunityNode(nodeId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setNode(result);
        setName(result.name);
        setDescription(result.description);
        setCategory(result.category);
        setIcon(result.icon);
        setPrompt(result.prompt);
        setInputHint(result.input_hint);
        setOutputFormat(result.output_format as CommunityNodeOutputFormat);
        setSchemaText(
          result.output_schema
            ? JSON.stringify(result.output_schema, null, 2)
            : '',
        );
        setExampleText('');
        setModelPreference(result.model_preference);
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : '加载节点管理信息失败';
        toast.error(message);
        router.push('/workspace');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nodeId, router]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !prompt.trim()) {
      toast.error('请先填写完整的名称、描述和 Prompt');
      return;
    }
    if (outputFormat === 'json' && !parsedSchema) {
      toast.error('JSON 输出模式下需要合法的 JSON Schema');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCommunityNode(nodeId, {
        name: name.trim(),
        description: description.trim(),
        category: category as CommunityNodeCategory,
        icon,
        prompt,
        input_hint: inputHint.trim(),
        output_format: outputFormat,
        output_schema: outputFormat === 'json' ? parsedSchema : null,
        model_preference: modelPreference as CommunityNodeModelPreference,
      });
      setNode(updated);
      setSchemaText(
        updated.output_schema
          ? JSON.stringify(updated.output_schema, null, 2)
          : '',
      );
      toast.success('共享节点已更新');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '更新共享节点失败';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!node) {
      return;
    }

    const confirmed = window.confirm(
      `确认删除共享节点“${node.name}”？该操作不可恢复。`,
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    try {
      await deleteCommunityNode(nodeId);
      toast.success('共享节点已删除');
      router.push('/workspace');
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '删除共享节点失败';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm text-muted-foreground">加载节点管理信息中...</p>
      </div>
    );
  }

  if (!node) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push('/workspace')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </button>
          <h1 className="text-2xl font-semibold text-foreground">
            管理共享节点
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            修改节点参数、Prompt 与输出约束，或删除共享。
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-right text-sm">
          <p className="font-medium text-foreground">{node.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            状态：{node.status}
          </p>
        </div>
      </div>

      <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
            className="min-h-[96px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm">
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
          <label className="space-y-2 text-sm">
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
          <label className="space-y-2 text-sm">
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
            className="min-h-[220px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/40"
          />
        </label>

        <label className="space-y-2 text-sm">
          <span className="font-medium text-foreground">输入提示</span>
          <input
            value={inputHint}
            onChange={(event) => setInputHint(event.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40"
          />
        </label>

        {node.knowledge_file_name ? (
          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            <p className="font-medium text-foreground">已绑定知识文件</p>
            <p className="mt-1 text-muted-foreground">
              {node.knowledge_file_name} · {formatFileSize(node.knowledge_file_size)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              当前版本支持保留与删除共享；如需替换知识文件，可在后续迭代补充。
            </p>
          </div>
        ) : null}

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

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? '删除中...' : '删除共享'}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/workspace')}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg border border-primary/30 bg-primary px-4 py-2 text-sm text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}
