'use client';

/**
 * ChatInputBar — 输入栏: 模式切换 + 思考深度 + 模型选择 + 发送.
 * 窄侧栏时根据工具条实测宽度合并为单一设置菜单（非视口断点）.
 */

import { useCallback, useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  Loader2,
  ArrowRight,
  Square,
  Brain,
  Route,
  MessageCircle,
  Wand2,
  SlidersHorizontal,
  Crown,
  Star,
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import type { AIMode, ThinkingDepth } from './SidebarAIPanel';
import type { ChatModelOption } from '@/services/ai-catalog.service';
import type { TierType } from '@/services/auth.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MODE_CONFIG: Record<AIMode, { icon: typeof Brain; label: string; hint: string; desc: string }> = {
  plan: { icon: Brain, label: '规划模式', hint: '深入分析目标并输出学习路径', desc: '不直接修改画布，仅提供深度分析和架构规划建议' },
  chat: { icon: MessageCircle, label: '对话模式', hint: '自由提问，解答学术疑惑', desc: '纯文本学术对话，支持软引导切换操作模式' },
  create: { icon: Wand2, label: '创建模式', hint: '创建、复制节点或搭建工作流', desc: '直接操作画布：支持复制节点、调整结构与连线' },
};

const DEPTH_CONFIG: Record<ThinkingDepth, { label: string; color: string }> = {
  fast: { label: '快速', color: 'text-emerald-500' },
  balanced: { label: '均衡', color: 'text-blue-500' },
  deep: { label: '深度', color: 'text-amber-500' },
};

const TIER_ORDER: Record<string, number> = { free: 0, pro: 1, pro_plus: 2, ultra: 3 };

/** 工具条内容宽度低于此值时合并为单一菜单（依据侧栏实测宽度，非 sm/md 视口） */
const MERGE_TOOLBAR_WIDTH_AT = 304;
/** 在水合前用语 panel 宽度推断工具条宽度：约等于 panel − 外层与内边距 */
const PANEL_TO_TOOLBAR_SLOP = 44;

interface ChatInputBarProps {
  input: string;
  setInput: (v: string) => void;
  mode: AIMode;
  setMode: (m: AIMode) => void;
  thinkingDepth: ThinkingDepth;
  setThinkingDepth: (d: ThinkingDepth) => void;
  loading: boolean;
  streaming: boolean;
  error: string | null;
  setError: (e: string | null) => void;
  onSend: () => void;
  chatModel: ChatModelOption | null;
  chatModels: ChatModelOption[];
  onModelChange: (m: ChatModelOption) => void;
  userTier: TierType;
  isModelsLoading: boolean;
  modelsError: boolean;
  onModelsRetry: () => void;
  /** 侧栏内容区宽度（persist 水合前后用作紧凑模式初始推断） */
  panelWidthHint?: number;
}

export function ChatInputBar({
  input, setInput, mode, setMode,
  thinkingDepth, setThinkingDepth,
  loading, streaming, error, setError, onSend,
  chatModel, chatModels, onModelChange, userTier,
  isModelsLoading, modelsError, onModelsRetry,
  panelWidthHint = 360,
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toolbarRowRef = useRef<HTMLDivElement>(null);
  const [toolbarWidth, setToolbarWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = toolbarRowRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === 'number' && w >= 0) setToolbarWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const compactToolbar =
    toolbarWidth !== null
      ? toolbarWidth < MERGE_TOOLBAR_WIDTH_AT
      : panelWidthHint - PANEL_TO_TOOLBAR_SLOP < MERGE_TOOLBAR_WIDTH_AT;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [setInput]);

  const cycleDepth = useCallback(() => {
    setThinkingDepth(thinkingDepth === 'fast' ? 'balanced' : thinkingDepth === 'balanced' ? 'deep' : 'fast');
  }, [thinkingDepth, setThinkingDepth]);

  const supportsThinking = chatModel?.supportsThinking ?? false;
  const userLevel = TIER_ORDER[userTier ?? 'free'] ?? 0;
  const ModeIcon = MODE_CONFIG[mode].icon;

  return (
    <div className="shrink-0 p-3 pt-1 min-w-0">
      {error && !loading ? (
        <div className="mb-2 flex items-center justify-between px-2 py-1 rounded-md bg-destructive/10">
          <p className="text-[11px] text-destructive/80 truncate flex-1 min-w-0">{error}</p>
          <button type="button" onClick={() => setError(null)} className="ml-2 text-destructive/50 hover:text-destructive shrink-0">
            <span className="sr-only">关闭</span>✕
          </button>
        </div>
      ) : null}

      <div className="node-paper-bg dark:bg-slate-900 flex flex-col rounded-xl border-[1.5px] border-border/50 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all min-w-0">
        <textarea
          ref={textareaRef}
          className="min-h-[40px] max-h-[120px] w-full resize-none bg-transparent px-3.5 py-3 text-[13px] text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none font-serif touch-manipulation"
          placeholder={MODE_CONFIG[mode].hint}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend(); }}
          disabled={loading}
          rows={1}
        />

        <div
          ref={toolbarRowRef}
          className="flex min-w-0 flex-nowrap items-center justify-between gap-1 px-2 pb-2"
        >
          {compactToolbar ? (
            <>
              <div className="min-w-0 flex-1 pr-1">
                <CompactChatSettingsMenu
                  mode={mode}
                  setMode={setMode}
                  thinkingDepth={thinkingDepth}
                  setThinkingDepth={setThinkingDepth}
                  supportsThinking={supportsThinking}
                  chatModel={chatModel}
                  chatModels={chatModels}
                  onModelChange={onModelChange}
                  userLevel={userLevel}
                  isModelsLoading={isModelsLoading}
                  modelsError={modelsError}
                  onModelsRetry={onModelsRetry}
                />
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSend}
                  disabled={loading && !streaming}
                  className={`flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border-[1.5px] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${streaming ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5'}`}
                  title={streaming ? '停止' : '发送'}
                >
                  {loading && !streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : streaming ? <Square className="h-3 w-3 fill-current" aria-hidden /> : <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
                  <span className="sr-only">{streaming ? '停止' : '发送'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-1.5" ref={dropdownRef}>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border-[1px] border-border/40 bg-slate-100 px-2 py-1 text-[11px] font-medium text-foreground/80 shadow-sm transition-all hover:border-border/60 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <ModeIcon className="h-3 w-3 shrink-0 text-primary/80" aria-hidden />
                    <span className="truncate">{MODE_CONFIG[mode].label}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute bottom-full left-0 z-50 mb-2 w-64 origin-bottom-left animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border-[1.5px] border-slate-200 bg-white py-1 shadow-lg duration-100 dark:border-slate-800 dark:bg-slate-900">
                      <div className="mb-1 border-b-[1px] border-slate-100 px-3 py-1.5 dark:border-slate-800">
                        <span className="font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">选择对话模式</span>
                      </div>
                      {(Object.entries(MODE_CONFIG) as [AIMode, typeof MODE_CONFIG[AIMode]][]).map(([key, cfg]) => {
                        const active = mode === key;
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => { setMode(key); setDropdownOpen(false); }}
                            className={`flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors ${active ? 'bg-primary/5 dark:bg-primary/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                          >
                            <div className={`mt-0.5 rounded-md p-1 ${active ? 'bg-primary/10 text-primary dark:bg-primary/30' : 'bg-slate-100 text-muted-foreground dark:bg-slate-800'}`}>
                              <Icon className="h-3.5 w-3.5" aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={`font-serif text-[12px] font-semibold leading-tight ${active ? 'text-primary' : 'text-foreground/90'}`}>{cfg.label}</div>
                              <div className="mt-0.5 font-serif text-[10px] leading-snug text-muted-foreground/80">{cfg.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {supportsThinking && (
                  <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                    <div className="h-3 w-px shrink-0 bg-border/30" aria-hidden />
                    <button
                      type="button"
                      onClick={cycleDepth}
                      className={`flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-[10px] font-medium transition-all hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:hover:bg-slate-800 ${DEPTH_CONFIG[thinkingDepth].color}`}
                      title={`思考深度: ${DEPTH_CONFIG[thinkingDepth].label}`}
                    >
                      <Route className="h-3 w-3 shrink-0" aria-hidden />
                      {DEPTH_CONFIG[thinkingDepth].label}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <ModelSelector
                  value={chatModel}
                  options={chatModels}
                  onChange={onModelChange}
                  userTier={userTier}
                  isLoading={isModelsLoading}
                  isError={modelsError}
                  onRetry={onModelsRetry}
                />
                <button
                  type="button"
                  onClick={onSend}
                  disabled={loading && !streaming}
                  className={`flex h-9 w-9 min-h-9 min-w-9 items-center justify-center rounded-lg border-[1.5px] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${streaming ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5'}`}
                  title={streaming ? '停止' : '发送'}
                >
                  {loading && !streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : streaming ? <Square className="h-3 w-3 fill-current" aria-hidden /> : <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
                  <span className="sr-only">{streaming ? '停止' : '发送'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface CompactChatSettingsMenuProps {
  mode: AIMode;
  setMode: (m: AIMode) => void;
  thinkingDepth: ThinkingDepth;
  setThinkingDepth: (d: ThinkingDepth) => void;
  supportsThinking: boolean;
  chatModel: ChatModelOption | null;
  chatModels: ChatModelOption[];
  onModelChange: (m: ChatModelOption) => void;
  userLevel: number;
  isModelsLoading: boolean;
  modelsError: boolean;
  onModelsRetry: () => void;
}

function CompactChatSettingsMenu({
  mode,
  setMode,
  thinkingDepth,
  setThinkingDepth,
  supportsThinking,
  chatModel,
  chatModels,
  onModelChange,
  userLevel,
  isModelsLoading,
  modelsError,
  onModelsRetry,
}: CompactChatSettingsMenuProps) {
  const summaryParts: string[] = [MODE_CONFIG[mode].label];
  if (supportsThinking) summaryParts.push(DEPTH_CONFIG[thinkingDepth].label);
  if (chatModel?.displayName) summaryParts.push(chatModel.displayName);
  const summary = summaryParts.join(' · ');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-9 min-w-0 max-w-[calc(100%-3rem)] items-center gap-1.5 rounded-md border-[1px] border-border/40 bg-slate-100 px-2 py-1 text-left text-[11px] font-medium text-foreground/80 shadow-sm transition-all hover:border-border/60 hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700"
          title={summary}
          aria-label={`对话与模型设置：${summary}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-primary/80" aria-hidden />
          <span className="min-w-0 truncate whitespace-nowrap">{summary}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        sideOffset={6}
        className="w-[min(18rem,calc(100vw-1rem))] max-h-[min(24rem,var(--radix-dropdown-menu-content-available-height))] overflow-y-auto overscroll-contain"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">对话模式</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={mode} onValueChange={(v) => setMode(v as AIMode)}>
          {(Object.entries(MODE_CONFIG) as [AIMode, typeof MODE_CONFIG[AIMode]][]).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <DropdownMenuRadioItem key={key} value={key} className="text-[13px]">
                <Icon className="h-3.5 w-3.5" aria-hidden />
                <span className="truncate">{cfg.label}</span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        {supportsThinking ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">思考深度</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={thinkingDepth} onValueChange={(v) => setThinkingDepth(v as ThinkingDepth)}>
              {(Object.entries(DEPTH_CONFIG) as [ThinkingDepth, typeof DEPTH_CONFIG[ThinkingDepth]][]).map(([key, cfg]) => (
                <DropdownMenuRadioItem key={key} value={key} className="text-[13px]">
                  <Route className={`h-3.5 w-3.5 ${cfg.color}`} aria-hidden />
                  {cfg.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        ) : null}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">模型</DropdownMenuLabel>
        {isModelsLoading ? (
          <div className="px-2 py-2 text-xs text-muted-foreground">加载中…</div>
        ) : modelsError ? (
          <DropdownMenuItem className="text-[13px]" onSelect={() => onModelsRetry()}>
            重试加载模型
          </DropdownMenuItem>
        ) : (
          <DropdownMenuRadioGroup
            value={chatModel?.key ?? ''}
            onValueChange={(key) => {
              const m = chatModels.find((x) => x.key === key);
              if (m) onModelChange(m);
            }}
          >
            {chatModels.map((model) => {
              const requiredLevel = TIER_ORDER[model.requiredTier] ?? 0;
              const isLocked = userLevel < requiredLevel;
              return (
                <DropdownMenuRadioItem key={model.key} value={model.key} disabled={isLocked} className="text-[13px]">
                  <span className="min-w-0 flex-1 truncate" title={model.description || model.displayName}>
                    {model.displayName}
                  </span>
                  {model.isRecommended ? (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-600/40 bg-emerald-500/15 px-1 py-0.5 text-[8px] font-semibold text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400">
                      <Star className="h-2 w-2" aria-hidden />
                      推荐
                    </span>
                  ) : null}
                  {model.isPremium ? (
                    <span className="flex shrink-0 items-center gap-0.5 rounded-full border border-amber-600/40 bg-amber-500/15 px-1 py-0.5 text-[8px] font-semibold text-amber-700 dark:border-amber-400/40 dark:text-amber-400">
                      <Crown className="h-2 w-2" aria-hidden />
                      PRO
                    </span>
                  ) : null}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
