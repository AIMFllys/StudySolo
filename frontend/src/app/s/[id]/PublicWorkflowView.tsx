'use client';

import { Heart, Star, GitFork, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { toggleLike, toggleFavorite, forkWorkflow } from '@/services/workflow.service';
import type { WorkflowPublicView } from '@/types/workflow';

const ReadOnlyCanvas = dynamic(
  () => import('@/components/workflow/ReadOnlyCanvas'),
  { ssr: false, loading: () => <CanvasPlaceholder /> }
);

function CanvasPlaceholder() {
  return (
    <div className="rounded-lg border border-border bg-muted/30 min-h-[500px] flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <div className="h-8 w-8 mx-auto mb-2 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
        <p className="text-xs">加载画布预览...</p>
      </div>
    </div>
  );
}

interface Props {
  workflow: WorkflowPublicView;
}

export default function PublicWorkflowView({ workflow }: Props) {
  const router = useRouter();
  const [likes, setLikes] = useState(workflow.likes_count);
  const [favs, setFavs] = useState(workflow.favorites_count);
  const [liked, setLiked] = useState(workflow.is_liked ?? false);
  const [faved, setFaved] = useState(workflow.is_favorited ?? false);
  const [forking, setForking] = useState(false);

  async function handleLike() {
    try {
      const res = await toggleLike(workflow.id);
      setLiked(res.toggled);
      setLikes(res.count);
    } catch {
      toast.error('请先登录后再操作');
    }
  }

  async function handleFavorite() {
    try {
      const res = await toggleFavorite(workflow.id);
      setFaved(res.toggled);
      setFavs(res.count);
    } catch {
      toast.error('请先登录后再操作');
    }
  }

  async function handleFork() {
    setForking(true);
    try {
      const forked = await forkWorkflow(workflow.id);
      toast.success('已 Fork 到我的工作空间');
      router.push(`/c/${forked.id}`);
    } catch {
      toast.error('Fork 失败，请先登录');
      setForking(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-serif font-bold text-foreground truncate">
              {workflow.name}
            </h1>
            {workflow.description && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {workflow.description}
              </p>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span>by {workflow.owner_name || '未知用户'}</span>
              {workflow.is_official && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 font-medium">
                  官方
                </span>
              )}
              {workflow.is_featured && (
                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-800 font-medium">
                  精选
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Owner edit entry */}
            {workflow.is_owner && (
              <button
                onClick={() => router.push(`/c/${workflow.id}`)}
                className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>编辑此工作流</span>
              </button>
            )}

            <button
              onClick={handleLike}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs border transition-colors ${
                liked
                  ? 'bg-red-50 border-red-200 text-red-600'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
              <span>{likes}</span>
            </button>

            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs border transition-colors ${
                faved
                  ? 'bg-amber-50 border-amber-200 text-amber-600'
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${faved ? 'fill-current' : ''}`} />
              <span>{favs}</span>
            </button>

            <button
              onClick={handleFork}
              disabled={forking}
              className="flex items-center gap-1 rounded-md bg-foreground text-background px-3 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <GitFork className="h-3.5 w-3.5" />
              <span>{forking ? 'Fork 中...' : 'Fork 到我的空间'}</span>
            </button>
          </div>
        </div>

        {/* Tags */}
        {workflow.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {workflow.tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Canvas preview — real interactive (view-only) canvas */}
      <div className="rounded-lg border border-border overflow-hidden">
        <ReadOnlyCanvas
          nodes={workflow.nodes_json}
          edges={workflow.edges_json}
          className="min-h-[500px]"
        />
      </div>

      {/* Node summary (below canvas) */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span>共 {workflow.nodes_json.length} 个节点</span>
        <span>·</span>
        <span>{workflow.edges_json.length} 条连线</span>
      </div>
    </div>
  );
}
