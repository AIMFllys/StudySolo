'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Loader2,
  Sparkles,
  Plus,
  MoreHorizontal,
  History,
  ChevronDown,
  X,
  Trash2,
  ArrowRight,
  Mic,
  ChevronUp
} from 'lucide-react';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import type { Edge, Node } from '@xyflow/react';

interface GenerateResponse {
  nodes: Node[];
  edges: Edge[];
  implicit_context: Record<string, unknown>;
}

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ConversationRecord {
  id: string;
  title: string;
  preview: string;
  timestamp: number;
}

/* ─── Thinking Intensity Levels ─── */
const THINKING_LEVELS = [
  { value: 'quick', shortLabel: '思考', label: '思考 Low' },
  { value: 'balanced', shortLabel: '思考', label: '思考 Medium' },
  { value: 'deep', shortLabel: '思考', label: '思考 High' },
] as const;

/* ─── Node Complexity Levels ─── */
const COMPLEXITY_LEVELS = [
  { value: 'simple', shortLabel: '节点', label: '简单的流程' },
  { value: 'standard', shortLabel: '节点', label: '一般复杂的节点' },
  { value: 'complex', shortLabel: '节点', label: '更复杂的节点' },
] as const;

export function SidebarAIPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState<string>('balanced');
  const [complexityLevel, setComplexityLevel] = useState<string>('standard');
  const [showThinkingPicker, setShowThinkingPicker] = useState(false);
  const [showComplexityPicker, setShowComplexityPicker] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const thinkingPickerRef = useRef<HTMLDivElement>(null);
  const complexityPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { replaceWorkflowGraph, setGenerationContext, lastPrompt } = useWorkflowStore();

  /* ─── Mock conversation records (replace with API) ─── */
  const [conversations] = useState<ConversationRecord[]>([
    { id: '1', title: '英语学习工作流', preview: '帮我创建一个英语四级学习流程...', timestamp: Date.now() - 86400000 },
    { id: '2', title: '数据分析管道', preview: '我需要一个数据清洗和分析的...', timestamp: Date.now() - 172800000 },
    { id: '3', title: '论文写作框架', preview: '设计一个学术论文写作的工作流...', timestamp: Date.now() - 259200000 },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  /* ─── Click outside to close dropdowns ─── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(e.target as HTMLElement)) {
        setShowHistoryDropdown(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as HTMLElement)) {
        setShowMoreMenu(false);
      }
      if (thinkingPickerRef.current && !thinkingPickerRef.current.contains(e.target as HTMLElement)) {
        setShowThinkingPicker(false);
      }
      if (complexityPickerRef.current && !complexityPickerRef.current.contains(e.target as HTMLElement)) {
        setShowComplexityPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ─── Auto-resize textarea ─── */
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const handleNewConversation = useCallback(() => {
    setHistory([]);
    setError(null);
    setInput('');
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setError(null);
    setShowMoreMenu(false);
  }, []);

  const handleGenerate = async () => {
    if (!input.trim() || loading) return;
    const userInput = input.trim();

    setHistory((prev) => [...prev, { role: 'user', content: userInput, timestamp: Date.now() }]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);
    setError(null);

    replaceWorkflowGraph(
      [{
        id: 'generating-node',
        position: { x: 300, y: 200 },
        type: 'generating',
        data: {},
      }],
      []
    );

    try {
      const res = await fetch('/api/ai/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: userInput,
          thinking_level: thinkingLevel,
          complexity_level: complexityLevel,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? `HTTP ${res.status}`);
      }

      const data: GenerateResponse = await res.json();
      replaceWorkflowGraph(data.nodes, data.edges);
      setGenerationContext(userInput, data.implicit_context);

      const nodeCount = data.nodes.length;
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `已生成 ${nodeCount} 个工作流节点。`,
          timestamp: Date.now(),
        },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '生成失败，请重试';
      setError(message);
      setHistory((prev) => [
        ...prev,
        { role: 'assistant', content: `❌ ${message}`, timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const currentThinking = THINKING_LEVELS.find((l) => l.value === thinkingLevel) ?? THINKING_LEVELS[1];
  const currentComplexity = COMPLEXITY_LEVELS.find((l) => l.value === complexityLevel) ?? COMPLEXITY_LEVELS[1];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* ═══════════════ TOP BAR (Merged with Header) ═══════════════ */}
      <div className="shrink-0 flex items-center justify-between px-3 py-3 border-b border-border/50">
        
        {/* Title */}
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground font-serif">
          AI 对话
        </span>

        {/* Right side controls */}
        <div className="flex items-center gap-1">
          {/* History Dropdown */}
          <div className="relative" ref={historyDropdownRef}>
            <button
              type="button"
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
              title="对话记录"
            >
              <History className="h-3 w-3" />
              <span className="font-medium text-[10px]">记录</span>
              <ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 opacity-70 ${showHistoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showHistoryDropdown && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-xl border-[1.5px] border-border/50 node-paper-bg p-1.5 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 font-serif">
                  最近对话
                </div>
                {conversations.length === 0 ? (
                  <p className="px-2 py-3 text-center text-xs text-muted-foreground/50">暂无记录</p>
                ) : (
                  <div className="max-h-56 overflow-y-auto scrollbar-hide">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        type="button"
                        onClick={() => {
                          setShowHistoryDropdown(false);
                        }}
                        className="group flex w-full flex-col gap-0.5 rounded-lg px-2.5 py-2 text-left transition-all hover:bg-white/5"
                      >
                        <span className="text-[11px] font-medium text-foreground/90 group-hover:text-foreground truncate">
                          {conv.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50 truncate">
                          {conv.preview}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-3 w-px bg-border/50 mx-0.5" />

          {/* New Chat */}
          <button
            type="button"
            onClick={handleNewConversation}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
            title="新建对话"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {/* More Menu */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-white/5 hover:text-foreground"
              title="更多选项"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border-[1.5px] border-border/50 node-paper-bg p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] text-muted-foreground transition-all hover:bg-white/5 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  清空对话
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ═══════════════ CHAT BODY ═══════════════ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
        {history.length === 0 ? (
          /* ─── Empty State ─── */
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="relative mb-5">
              <div className="node-paper-bg flex h-12 w-12 items-center justify-center rounded-xl border-[1.5px] border-border/50 shadow-sm">
                <Sparkles className="h-5 w-5 text-primary stroke-[1.5]" />
              </div>
            </div>
            <h3 className="text-[13px] font-bold text-foreground/90 font-serif">准备就绪</h3>
            <p className="mt-1.5 max-w-[200px] text-[11px] leading-relaxed text-muted-foreground/80 font-serif">
              描述你的学习或工作目标，我将为你构建专属工作流。
            </p>
            {lastPrompt ? (
              <div className="mt-4 flex items-center gap-1.5 rounded-lg border-[1.5px] border-border/50 bg-background/50 px-2.5 py-1.5 shadow-sm">
                <History className="h-3 w-3 text-muted-foreground stroke-[1.5]" />
                <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">
                  {lastPrompt.slice(0, 40)}{lastPrompt.length > 40 ? '...' : ''}
                </span>
              </div>
            ) : null}
          </div>
        ) : (
          /* ─── Chat Messages ─── */
          <div className="space-y-4 p-4">
            {history.map((entry) => (
              <div
                key={entry.timestamp}
                className={`group relative max-w-[92%] ${
                  entry.role === 'user' ? 'ml-auto' : 'mr-auto'
                }`}
              >
                <div
                  className={`node-paper-bg rounded-xl border-[1.5px] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm font-serif ${
                    entry.role === 'user'
                      ? 'border-primary/30 text-foreground/90'
                      : 'border-border/50 text-foreground/90'
                  }`}
                >
                  {entry.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="mr-auto flex max-w-[85%] items-center gap-2 rounded-xl border-[1.5px] border-border/50 bg-background/50 shadow-sm px-3.5 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════ BOTTOM INPUT AREA ═══════════════ */}
      <div className="shrink-0 p-3 pt-1">
        
        {/* Error message */}
        {error && !loading ? (
          <div className="mb-2 flex items-center justify-between px-2 py-1 rounded-md bg-destructive/10">
            <p className="text-[11px] text-destructive/80 truncate flex-1">{error}</p>
            <button type="button" onClick={() => setError(null)} className="ml-2 text-destructive/50 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : null}

        {/* Unified Input Box (Replicating Reference Design) */}
        <div className="node-paper-bg flex flex-col rounded-xl border-[1.5px] border-border/50 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
          
          <textarea
            ref={textareaRef}
            className="min-h-[40px] max-h-[120px] w-full resize-none bg-transparent px-3.5 py-3 text-[13px] text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none font-serif"
            placeholder="描述你需要的工作流..."
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                void handleGenerate();
              }
            }}
            disabled={loading}
            rows={1}
          />

          <div className="flex items-center justify-between px-2 pb-2">
            {/* Left Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                title="附加上下文"
              >
                <Plus className="h-4 w-4" />
              </button>

              {/* Thinking Intensity */}
              <div className="relative" ref={thinkingPickerRef}>
                <button
                  type="button"
                  onClick={() => { setShowThinkingPicker(!showThinkingPicker); setShowComplexityPicker(false); }}
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-muted-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <ChevronUp className="h-3 w-3 opacity-60" />
                  <span className="whitespace-nowrap">{currentThinking.shortLabel}</span>
                </button>

                {showThinkingPicker && (
                  <div className="node-paper-bg absolute bottom-full left-0 z-50 mb-2 w-40 rounded-[10px] border-[1.5px] border-border/50 p-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-2 pb-1.5 pt-1 text-[11px] text-muted-foreground font-serif font-bold">思考深度</div>
                    <div className="mx-1 mb-1 border-t border-dashed border-border/40" />
                    {THINKING_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => { setThinkingLevel(level.value); setShowThinkingPicker(false); }}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] transition-all hover:bg-muted ${
                          thinkingLevel === level.value
                            ? 'bg-muted/80 text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="truncate">{level.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Node Complexity */}
              <div className="relative" ref={complexityPickerRef}>
                <button
                  type="button"
                  onClick={() => { setShowComplexityPicker(!showComplexityPicker); setShowThinkingPicker(false); }}
                  className="flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] text-muted-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                >
                  <ChevronUp className="h-3 w-3 opacity-60" />
                  <span className="whitespace-nowrap">{currentComplexity.shortLabel}</span>
                </button>

                {showComplexityPicker && (
                  <div className="node-paper-bg absolute bottom-full left-0 z-50 mb-2 w-44 rounded-[10px] border-[1.5px] border-border/50 p-1.5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="px-2 pb-1.5 pt-1 text-[11px] text-muted-foreground font-serif font-bold">节点复杂度</div>
                    <div className="mx-1 mb-1 border-t border-dashed border-border/40" />
                    {COMPLEXITY_LEVELS.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => { setComplexityLevel(level.value); setShowComplexityPicker(false); }}
                        className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] transition-all hover:bg-muted ${
                          complexityLevel === level.value
                            ? 'bg-muted/80 text-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="truncate">{level.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 pr-0.5">
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
                title="语音输入"
              >
                <Mic className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => void handleGenerate()}
                disabled={loading || !input.trim()}
                className="flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] border-primary/20 bg-primary/10 text-primary shadow-sm transition-all hover:bg-primary/20 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                title="发送"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
