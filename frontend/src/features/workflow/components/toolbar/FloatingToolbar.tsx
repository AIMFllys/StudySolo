'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  MousePointer2,
  Pencil,
  Hand,
  Search,
  Smile,
  ImagePlus,
  Play,
  Square,
} from 'lucide-react';
import { useWorkflowExecution } from '@/features/workflow/hooks/use-workflow-execution';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import SearchBar from '@/features/workflow/components/toolbar/SearchBar';
import EmojiPicker from '@/features/workflow/components/toolbar/EmojiPicker';
import EdgeTypePanel from '@/features/workflow/components/toolbar/EdgeTypePanel';

export type CanvasTool = 'select' | 'edit' | 'pan' | 'search';

interface FloatingToolbarProps {
  className?: string;
}

/**
 * Floating toolbar at bottom-center of the canvas.
 * Each tool has real behavior:
 *  - Arrow: selection mode (drag draws selection box, no canvas pan)
 *  - Pencil: future pro mode dialog
 *  - Hand: pan mode (default)
 *  - Search: node search overlay
 *  - Emoji: annotation picker
 *  - Upload: not supported modal
 */
export default function FloatingToolbar({ className = '' }: FloatingToolbarProps) {
  const [activeTool, setActiveTool] = useState<CanvasTool>('pan');
  const [showSearch, setShowSearch] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showEdgePanel, setShowEdgePanel] = useState(false);
  const { status, start, stop } = useWorkflowExecution();
  const nodes = useWorkflowStore((s) => s.nodes);
  const hasNodes = nodes.length > 0;
  const isRunning = status === 'running';

  const handleToolChange = useCallback((tool: CanvasTool) => {
    // Special behavior for edit tool — toggle edge type panel
    if (tool === 'edit') {
      setShowEdgePanel((prev) => !prev);
      setShowSearch(false);
      setShowEmoji(false);
      return;
    }

    // Close overlays when switching away
    if (tool !== 'search') setShowSearch(false);
    setShowEmoji(false);

    // Search tool: toggle search bar
    if (tool === 'search') {
      setShowSearch((prev) => !prev);
      setActiveTool('search');
      window.dispatchEvent(
        new CustomEvent('canvas:tool-change', { detail: { tool: 'pan' } })
      );
      return;
    }

    setActiveTool(tool);
    window.dispatchEvent(
      new CustomEvent('canvas:tool-change', { detail: { tool } })
    );
  }, []);

  const handleUpload = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('canvas:show-modal', {
        detail: {
          title: '上传文件到画布',
          message: '暂不支持上传文件到画布功能，敬请期待未来版本更新。',
        },
      })
    );
  }, []);

  const handleEmojiToggle = useCallback(() => {
    setShowEmoji((prev) => !prev);
    setShowSearch(false);
  }, []);

  const handleEmojiSelect = useCallback((emoji: string) => {
    window.dispatchEvent(
      new CustomEvent('canvas:add-annotation', { detail: { emoji } })
    );
    setShowEmoji(false);
  }, []);

  const handleSearchClose = useCallback(() => {
    setShowSearch(false);
    if (activeTool === 'search') {
      setActiveTool('pan');
    }
  }, [activeTool]);

  // Global Ctrl+P shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowSearch((prev) => !prev);
        setActiveTool('search');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Overlays above toolbar */}
      {showSearch && <SearchBar onClose={handleSearchClose} />}
      {showEmoji && (
        <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
      )}

      <div className={`canvas-floating-toolbar ${className}`}>
        {/* Tool group */}
        <button
          type="button"
          className={activeTool === 'select' ? 'active' : ''}
          onClick={() => handleToolChange('select')}
          title="选择工具 (V) — 框选节点"
        >
          <MousePointer2 className="h-[18px] w-[18px]" />
        </button>

        <div className="relative">
          <button
            type="button"
            className={showEdgePanel ? 'active' : ''}
            onClick={() => handleToolChange('edit')}
            title="连线工具 (E) — 选择连线类型"
          >
            <Pencil className="h-[18px] w-[18px]" />
          </button>
          {showEdgePanel && (
            <EdgeTypePanel onClose={() => setShowEdgePanel(false)} />
          )}
        </div>

        <button
          type="button"
          className={activeTool === 'pan' ? 'active' : ''}
          onClick={() => handleToolChange('pan')}
          title="平移工具 (H) — 拖拽画布"
        >
          <Hand className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          className={showSearch || activeTool === 'search' ? 'active' : ''}
          onClick={() => handleToolChange('search')}
          title="搜索节点 (Ctrl+P)"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <div className="toolbar-divider" />

        {/* Action group */}
        <button
          type="button"
          className={showEmoji ? 'active' : ''}
          onClick={handleEmojiToggle}
          title="添加标注"
        >
          <Smile className="h-[18px] w-[18px]" />
        </button>

        <button
          type="button"
          onClick={handleUpload}
          title="上传文件到画布"
        >
          <ImagePlus className="h-[18px] w-[18px]" />
        </button>

        <div className="toolbar-divider" />

        {/* Run/Stop */}
        {isRunning ? (
          <button
            type="button"
            onClick={stop}
            className="!text-rose-400"
            title="停止运行"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start()}
            disabled={!hasNodes}
            className={hasNodes ? '!text-emerald-400' : '!text-muted-foreground/30 !cursor-not-allowed'}
            title="运行全部"
          >
            <Play className="h-4 w-4 fill-current" />
          </button>
        )}
      </div>
    </>
  );
}
