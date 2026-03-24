'use client';

/**
 * ChatInputBar — 输入栏: 模式切换 + 思考深度 + 发送.
 *
 * 从 SidebarAIPanel 抽离, 保持单文件 ≤ 300 行。
 */

import { useCallback, useRef } from 'react';
import { Loader2, ArrowRight, Square, Brain, MessageCircle, Wand2 } from 'lucide-react';
import type { AIMode, ThinkingDepth } from './SidebarAIPanel';

const MODE_CONFIG: Record<AIMode, { icon: typeof Brain; label: string; hint: string }> = {
  plan: { icon: Brain, label: '规划', hint: '深度分析目标，规划学习路径' },
  chat: { icon: MessageCircle, label: '对话', hint: '自由对话，提问讨论' },
  create: { icon: Wand2, label: '创建', hint: '创建节点、复制节点、搭建工作流' },
};

const DEPTH_CONFIG: Record<ThinkingDepth, { label: string; color: string }> = {
  fast: { label: '快速', color: 'text-emerald-500' },
  balanced: { label: '均衡', color: 'text-blue-500' },
  deep: { label: '深度', color: 'text-amber-500' },
};

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
}

export function ChatInputBar({
  input, setInput, mode, setMode,
  thinkingDepth, setThinkingDepth,
  loading, streaming, error, setError, onSend,
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [setInput]);

  const cycleDepth = useCallback(() => {
    setThinkingDepth(thinkingDepth === 'fast' ? 'balanced' : thinkingDepth === 'balanced' ? 'deep' : 'fast');
  }, [thinkingDepth, setThinkingDepth]);

  return (
    <div className="shrink-0 p-3 pt-1">
      {error && !loading ? (
        <div className="mb-2 flex items-center justify-between px-2 py-1 rounded-md bg-destructive/10">
          <p className="text-[11px] text-destructive/80 truncate flex-1">{error}</p>
          <button type="button" onClick={() => setError(null)} className="ml-2 text-destructive/50 hover:text-destructive">
            <span className="sr-only">关闭</span>✕
          </button>
        </div>
      ) : null}

      <div className="node-paper-bg flex flex-col rounded-xl border-[1.5px] border-border/50 shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <textarea
          ref={textareaRef}
          className="min-h-[40px] max-h-[120px] w-full resize-none bg-transparent px-3.5 py-3 text-[13px] text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none font-serif"
          placeholder={MODE_CONFIG[mode].hint}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend(); }}
          disabled={loading}
          rows={1}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          {/* Mode buttons */}
          <div className="flex items-center gap-0.5">
            {(Object.entries(MODE_CONFIG) as [AIMode, typeof MODE_CONFIG[AIMode]][]).map(([key, cfg]) => {
              const Icon = cfg.icon;
              const active = mode === key;
              return (
                <button key={key} type="button" onClick={() => setMode(key)} title={cfg.hint}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-all ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5'}`}>
                  <Icon className="h-3 w-3" />{cfg.label}
                </button>
              );
            })}

            {mode !== 'chat' && (
              <>
                <div className="h-3 w-px bg-border/30 mx-1" />
                <button type="button" onClick={cycleDepth}
                  className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-all hover:bg-white/5 ${DEPTH_CONFIG[thinkingDepth].color}`}
                  title={`思考深度: ${DEPTH_CONFIG[thinkingDepth].label}`}>
                  <Brain className="h-3 w-3" />{DEPTH_CONFIG[thinkingDepth].label}
                </button>
              </>
            )}
          </div>

          {/* Status + Send */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${streaming ? 'text-primary bg-primary/10' : 'text-muted-foreground/40'}`}>
              {streaming ? '● 流式' : '○ 就绪'}
            </span>
            <button onClick={onSend} disabled={loading && !streaming}
              className={`flex h-7 w-7 items-center justify-center rounded-lg border-[1.5px] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-40 ${streaming ? 'border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20' : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:-translate-y-0.5'}`}
              title={streaming ? '停止' : '发送'}>
              {loading && !streaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : streaming ? <Square className="h-3 w-3 fill-current" /> : <ArrowRight className="h-4 w-4" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
