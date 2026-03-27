'use client';

import { createPortal } from 'react-dom';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  BrainCircuit,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  FileTerminal,
  GripVertical,
  LayoutGrid,
  LibraryBig,
  Network,
  NotebookPen,
  Search,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CommunityNodeList } from '@/features/community-nodes/components/CommunityNodeList';
import { NODE_TYPE_META, getNodeTheme } from '@/features/workflow/constants/workflow-meta';
import type { NodeType } from '@/types';

const NODE_CATEGORIES: { id: string; label: string; icon: LucideIcon; types: NodeType[] }[] = [
  {
    id: 'trigger',
    label: '输入源',
    icon: FileTerminal,
    types: ['trigger_input', 'knowledge_base', 'web_search'],
  },
  {
    id: 'ai',
    label: 'AI 处理',
    icon: BrainCircuit,
    types: ['ai_analyzer', 'ai_planner', 'content_extract', 'merge_polish'],
  },
  {
    id: 'content',
    label: '内容生成',
    icon: NotebookPen,
    types: ['outline_gen', 'summary', 'flashcard', 'quiz_gen', 'mind_map', 'chat_response'],
  },
  {
    id: 'data',
    label: '输出 & 存储',
    icon: LibraryBig,
    types: ['write_db', 'export_file'],
  },
  {
    id: 'logic',
    label: '逻辑控制',
    icon: Network,
    types: ['compare', 'logic_switch', 'loop_map', 'loop_group'],
  },
];

const ALL_TAG = 'all';

const NODE_EXTENDED_INFO: Partial<Record<NodeType, string>> = {
  trigger_input: '工作流的起始点。接收用户输入的学习目标、限制条件和上下文信息，作为后续节点的数据源。',
  ai_analyzer: '使用 AI 分析用户需求，提取关键学习目标、约束条件和上下文信息，为流程规划提供结构化数据。',
  ai_planner: '根据分析结果智能规划工作流路径，决定节点的拆分方式、连接关系与执行顺序。',
  outline_gen: '根据学习主题自动生成层次分明的知识大纲，包含章节划分和学习顺序建议。',
  content_extract: '从原始材料中智能提炼关键概念、核心案例和深度解释，去除冗余信息。',
  summary: '将多个内容源的信息整合归纳，生成结构化的学习重点和复习摘要。',
  flashcard: '将知识点转化为问答式闪卡，支持间隔重复记忆法，可导出至 Anki 等工具。',
  chat_response: '生成自然语言形式的学习建议、答复和引导，支持多轮对话式交互。',
  write_db: '将工作流处理结果持久化存储到数据库，并同步更新工作流运行记录。',
  compare: '对多个内容源进行多维度对比分析，识别异同点和互补关系。',
  mind_map: '将复杂知识体系转化为可视化思维导图，展示概念间的层级和关联关系。',
  quiz_gen: '基于学习内容自动生成多种题型的测验题目，附带详细解析和评分标准。',
  merge_polish: '整合来自多个节点的输出内容，进行统一风格润色和质量优化。',
  knowledge_base: '从已建立的知识库中检索与当前学习主题相关的内容，支持语义搜索。',
  web_search: '在互联网上搜索最新、最相关的学习资料，并智能整合到工作流中。',
  export_file: '将工作流的最终结果导出为 Markdown、PDF 等多种文件格式。',
  logic_switch: '基于条件表达式动态路由工作流，实现分支逻辑和条件判断。',
  loop_map: '对列表数据进行循环处理，每个元素独立经过指定的节点链。',
};

function NodeTooltip({
  nodeType,
  anchorRect,
}: {
  nodeType: NodeType;
  anchorRect: DOMRect;
}) {
  const meta = NODE_TYPE_META[nodeType];
  const extended = NODE_EXTENDED_INFO[nodeType];
  const nodeTheme = getNodeTheme(nodeType);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: anchorRect.top,
        left: anchorRect.right + 8,
        zIndex: 9999,
        maxWidth: 260,
      }}
      className="node-paper-bg animate-in fade-in slide-in-from-left-1 duration-150 rounded-xl border border-border p-3 shadow-lg backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-background shadow-sm ${nodeTheme.borderClass} ${nodeTheme.headerTextColor}`}
        >
          <div className={`absolute inset-0 pointer-events-none ${nodeTheme.innerBorderClass} m-[1px]`} />
          <meta.icon className="z-10 h-3.5 w-3.5 stroke-[2.5]" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{meta.label}</p>
          <p className="text-[10px] text-muted-foreground">{meta.description}</p>
        </div>
      </div>
      {extended ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{extended}</p>
      ) : null}
      <p className="mt-2 text-[9px] text-muted-foreground/50">拖拽到画布 或 点击添加</p>
    </div>,
    document.body,
  );
}

function TagFilterBar({
  selectedCategoryId,
  onSelect,
}: {
  selectedCategoryId: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const allTags = [
    { id: ALL_TAG, label: '全部', icon: LayoutGrid },
    ...NODE_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      icon: category.icon,
    })),
  ];
  const visibleTags = expanded ? allTags : allTags.slice(0, 3);

  return (
    <div className="shrink-0 border-b border-border px-2 py-2">
      <div className="flex flex-wrap items-center gap-1">
        {visibleTags.map((tag) => {
          const isActive = selectedCategoryId === tag.id;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onSelect(tag.id)}
              className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'node-paper-bg border-primary/30 text-primary shadow-sm'
                  : 'border-border/50 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <div className="tag-paper-texture pointer-events-none absolute inset-0 z-0 opacity-60" />
              <tag.icon className={`relative z-10 h-[14px] w-[14px] ${isActive ? 'text-primary' : 'text-slate-500'}`} />
              <span className="relative z-10 hidden sm:inline">{tag.id === ALL_TAG ? '全部' : tag.label.split(' ')[0]}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-auto flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronsUpDown className="h-3 w-3" />
          <span>{expanded ? '收起' : '展开'}</span>
        </button>
      </div>
    </div>
  );
}

function NodeStoreItem({ nodeType }: { nodeType: NodeType }) {
  const meta = NODE_TYPE_META[nodeType];
  const [hovered, setHovered] = useState(false);
  const itemRef = useRef<HTMLButtonElement>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      event.dataTransfer.setData('application/studysolo-node-type', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    [nodeType],
  );

  const handleClick = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('node-store:add-node', { detail: { nodeType } }),
    );
  }, [nodeType]);

  const handlePointerEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHovered(true), 400);
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setHovered(false);
  }, []);

  const nodeTheme = getNodeTheme(nodeType);
  const anchorRect = itemRef.current?.getBoundingClientRect();

  return (
    <>
      <button
        ref={itemRef}
        type="button"
        draggable
        onDragStart={handleDragStart}
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:scale-[0.98]"
      >
        <div
          className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-background shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform group-hover:scale-110 ${nodeTheme.borderClass} ${nodeTheme.headerTextColor}`}
        >
          <div className={`absolute inset-0 pointer-events-none ${nodeTheme.innerBorderClass} m-[1px]`} />
          <meta.icon className="z-10 h-3 w-3 stroke-[2.5]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-foreground">{meta.label}</p>
          <p className="truncate text-[9px] text-muted-foreground">{meta.description}</p>
        </div>
        <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
      {hovered && anchorRect ? <NodeTooltip nodeType={nodeType} anchorRect={anchorRect} /> : null}
    </>
  );
}

function CategorySection({
  label,
  types,
  searchQuery,
}: {
  label: string;
  types: NodeType[];
  searchQuery: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const filtered = useMemo(() => {
    if (!searchQuery) {
      return types;
    }
    const query = searchQuery.toLowerCase();
    return types.filter((type) => {
      const meta = NODE_TYPE_META[type];
      return (
        meta.label.toLowerCase().includes(query) ||
        meta.description.toLowerCase().includes(query) ||
        type.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, types]);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <div className="mb-1.5">
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="flex w-full items-center gap-1 rounded-md px-1 py-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70 transition-colors hover:text-muted-foreground"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {label}
        <span className="ml-auto text-[9px] text-muted-foreground/40">{filtered.length}</span>
      </button>
      {!collapsed ? (
        <div className="mt-0.5 space-y-0">
          {filtered.map((nodeType) => (
            <NodeStoreItem key={nodeType} nodeType={nodeType} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DefaultNodeStoreView() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_TAG);

  const visibleCategories = useMemo(() => {
    if (selectedCategory === ALL_TAG) {
      return NODE_CATEGORIES;
    }
    return NODE_CATEGORIES.filter((category) => category.id === selectedCategory);
  }, [selectedCategory]);

  const totalFiltered = useMemo(() => {
    const query = search.toLowerCase();
    return visibleCategories.reduce((sum, category) => {
      if (!search) {
        return sum + category.types.length;
      }
      return sum + category.types.filter((type) => {
        const meta = NODE_TYPE_META[type];
        return (
          meta.label.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query) ||
          type.toLowerCase().includes(query)
        );
      }).length;
    }, 0);
  }, [search, visibleCategories]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 px-2 pb-1.5 pt-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索节点..."
            className="w-full rounded-lg border border-border/50 bg-white/3 py-1.5 pl-7 pr-7 text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>

      <TagFilterBar
        selectedCategoryId={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <div className="shrink-0 px-3 py-1">
        <p className="text-[9px] text-muted-foreground/50">
          {search
            ? `找到 ${totalFiltered} 个节点`
            : selectedCategory === ALL_TAG
              ? '拖拽到画布，或点击添加'
              : `已筛选：${NODE_CATEGORIES.find((category) => category.id === selectedCategory)?.label}`}
        </p>
      </div>

      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 pb-2">
        {visibleCategories.map((category) => (
          <CategorySection
            key={category.id}
            label={category.label}
            types={category.types}
            searchQuery={search}
          />
        ))}
        {totalFiltered === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-muted-foreground/60">
            没有匹配的节点
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function NodeStorePanel() {
  const [view, setView] = useState<'default' | 'community'>('default');

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-2 py-2">
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setView('default')}
            className={`rounded-md px-3 py-1.5 text-[11px] transition-colors ${
              view === 'default'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            默认
          </button>
          <button
            type="button"
            onClick={() => setView('community')}
            className={`rounded-md px-3 py-1.5 text-[11px] transition-colors ${
              view === 'community'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            共享
          </button>
        </div>
      </div>

      {view === 'default' ? <DefaultNodeStoreView /> : <CommunityNodeList />}
    </div>
  );
}
