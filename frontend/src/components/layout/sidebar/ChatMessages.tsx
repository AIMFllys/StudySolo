'use client';

import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Navigation, Copy, Check } from 'lucide-react';

/* ── StudySolo AI Icon (custom vector-square) ── */
function StudySoloIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19.5 7a24 24 0 0 1 0 10" />
      <path d="M4.5 7a24 24 0 0 0 0 10" />
      <path d="M7 19.5a24 24 0 0 0 10 0" />
      <path d="M7 4.5a24 24 0 0 1 10 0" />
      <rect x="17" y="17" width="5" height="5" rx="1" />
      <rect x="17" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="17" width="5" height="5" rx="1" />
      <rect x="2" y="2" width="5" height="5" rx="1" />
    </svg>
  );
}
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useState, useCallback } from 'react';
import { PlanCard } from './PlanCard';

interface HistoryEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatMessagesProps {
  history: HistoryEntry[];
  loading: boolean;
  streaming: boolean;
  streamingMessageId: string | null;
  lastPrompt: string;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

/* ── Inline code copy button ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [text]);
  return (
    <button
      onClick={handleCopy}
      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-muted-foreground/60 opacity-0 transition-all hover:bg-white/10 hover:text-foreground/80 group-hover:opacity-100"
      title="复制代码"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

/* ── Streaming cursor ── */
function StreamCursor() {
  return (
    <span className="ai-stream-cursor ml-0.5 inline-block h-[14px] w-[2px] translate-y-[2px] rounded-full bg-primary/70" />
  );
}

/* ── AI Message — Antigravity style (no bubble) ── */
const AIMessage = memo(function AIMessage({
  entry,
  isStreaming,
}: {
  entry: HistoryEntry;
  isStreaming: boolean;
}) {
  const content = entry.content;

  // Plan XML detection
  if (content.includes('<plan>')) {
    return <PlanCard rawContent={content} />;
  }

  // Strip SUGGEST_MODE markers, capture for nudge
  const cleanContent = content.replace(/\[SUGGEST_MODE:(\w+)\]/g, '');
  const suggestMatch = content.match(/\[SUGGEST_MODE:(\w+)\]/);

  return (
    <div className="ai-msg-root">
      {/* Small sparkle icon */}
      <div className="mb-1.5 flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
          <StudySoloIcon className="h-3 w-3 text-primary/80" />
        </div>
        <span className="text-[10px] font-medium tracking-wider text-muted-foreground/50 font-sans">
          StudySolo AI
        </span>
      </div>

      {/* Rich Markdown content — NO bubble */}
      <div className="chat-markdown-body pl-0.5">
        {isStreaming && !cleanContent.trim() ? (
          /* ── Waiting for first token: magic wand loader ── */
          <div className="flex items-center gap-2.5 py-1">
            <div className="analyze">
              <svg
                height="24"
                width="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect height="24" width="24" fill="none" />
                {/* Clipboard board */}
                <path
                  className="board"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  stroke="#9ca3af"
                  d="M19.25 9.25V5.25C19.25 4.42157 18.5784 3.75 17.75 3.75H6.25C5.42157 3.75 4.75 4.42157 4.75 5.25V18.75C4.75 19.5784 5.42157 20.25 6.25 20.25H12.25"
                />
                {/* Star 2 (small sparkle) */}
                <path
                  className="star-2"
                  d="M9.18748 11.5066C9.12305 11.3324 8.87677 11.3324 8.81234 11.5066L8.49165 12.3732C8.47139 12.428 8.42823 12.4711 8.37348 12.4914L7.50681 12.8121C7.33269 12.8765 7.33269 13.1228 7.50681 13.1872L8.37348 13.5079C8.42823 13.5282 8.47139 13.5714 8.49165 13.6261L8.81234 14.4928C8.87677 14.6669 9.12305 14.6669 9.18748 14.4928L9.50818 13.6261C9.52844 13.5714 9.5716 13.5282 9.62634 13.5079L10.493 13.1872C10.6671 13.1228 10.6671 12.8765 10.493 12.8121L9.62634 12.4914C9.5716 12.4711 9.52844 12.428 9.50818 12.3732L9.18748 11.5066Z"
                />
                {/* Star 1 (large sparkle) */}
                <path
                  className="star-1"
                  d="M11.7345 6.63394C11.654 6.41629 11.3461 6.41629 11.2656 6.63394L10.8647 7.71728C10.8394 7.78571 10.7855 7.83966 10.717 7.86498L9.6337 8.26585C9.41605 8.34639 9.41605 8.65424 9.6337 8.73478L10.717 9.13565C10.7855 9.16097 10.8394 9.21493 10.8647 9.28335L11.2656 10.3667C11.3461 10.5843 11.654 10.5843 11.7345 10.3667L12.1354 9.28335C12.1607 9.21493 12.2147 9.16097 12.2831 9.13565L13.3664 8.73478C13.5841 8.65424 13.5841 8.34639 13.3664 8.26585L12.2831 7.86498C12.2147 7.83966 12.1607 7.78571 12.1354 7.71728L11.7345 6.63394Z"
                />
                {/* Pen / wand stick */}
                <path
                  className="stick"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                  stroke="#9ca3af"
                  d="M17 14L21.2929 18.2929C21.6834 18.6834 21.6834 19.3166 21.2929 19.7071L20.7071 20.2929C20.3166 20.6834 19.6834 20.6834 19.2929 20.2929L15 16M17 14L15.7071 12.7071C15.3166 12.3166 14.6834 12.3166 14.2929 12.7071L13.7071 13.2929C13.3166 13.6834 13.3166 14.3166 13.7071 14.7071L15 16M17 14L15 16"
                />
              </svg>
            </div>
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground/50 font-sans">
              正在思考…
            </span>
          </div>
        ) : isStreaming ? (
          /* ── Streaming in progress: markdown + cursor ── */
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {cleanContent}
            </ReactMarkdown>
            <StreamCursor />
          </div>
        ) : (
          /* ── Finished: static markdown ── */
          <div className="prose-chat">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={markdownComponents}
            >
              {cleanContent}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Soft nudge */}
      {suggestMatch && !isStreaming && (() => {
        const modeMap: Record<string, string> = { plan: '规划', create: '创建', chat: '对话' };
        const m = suggestMatch[1].toLowerCase();
        return (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2.5 flex items-center justify-between rounded-lg bg-muted/15 px-2.5 py-1.5 border border-border/30"
          >
            <span className="text-[10px] text-muted-foreground/80 font-sans">💡 建议切换到「{modeMap[m] || m}」模式</span>
            <button className="flex items-center gap-1 text-[10px] font-medium text-primary/80 hover:text-primary transition-colors">
              进入 {modeMap[m] || m} <Navigation className="h-2.5 w-2.5 ml-0.5 opacity-70" />
            </button>
          </motion.div>
        );
      })()}
    </div>
  );
});

/* ── Markdown custom components ── */
const markdownComponents = {
  p: ({ children, ...props }: React.ComponentProps<'p'>) => (
    <p className="mb-2 last:mb-0 leading-[1.7] text-foreground/85" {...props}>{children}</p>
  ),
  h1: ({ children, ...props }: React.ComponentProps<'h1'>) => (
    <h1 className="mb-2 mt-3 text-[15px] font-bold text-foreground/95 font-serif" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: React.ComponentProps<'h2'>) => (
    <h2 className="mb-2 mt-3 text-[14px] font-bold text-foreground/90 font-serif" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: React.ComponentProps<'h3'>) => (
    <h3 className="mb-1.5 mt-2.5 text-[13px] font-semibold text-foreground/90 font-serif" {...props}>{children}</h3>
  ),
  ul: ({ children, ...props }: React.ComponentProps<'ul'>) => (
    <ul className="mb-2 ml-4 list-disc space-y-0.5 text-foreground/80 marker:text-primary/40" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: React.ComponentProps<'ol'>) => (
    <ol className="mb-2 ml-4 list-decimal space-y-0.5 text-foreground/80" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: React.ComponentProps<'li'>) => (
    <li className="leading-[1.6]" {...props}>{children}</li>
  ),
  blockquote: ({ children, ...props }: React.ComponentProps<'blockquote'>) => (
    <blockquote className="my-2 border-l-2 border-primary/30 pl-3 text-muted-foreground/80 italic" {...props}>{children}</blockquote>
  ),
  strong: ({ children, ...props }: React.ComponentProps<'strong'>) => (
    <strong className="font-semibold text-foreground/95" {...props}>{children}</strong>
  ),
  a: ({ children, href, ...props }: React.ComponentProps<'a'>) => (
    <a href={href} className="text-primary/80 underline decoration-primary/30 underline-offset-2 hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  table: ({ children, ...props }: React.ComponentProps<'table'>) => (
    <div className="my-2 overflow-x-auto rounded-lg border border-border/30">
      <table className="w-full text-[11px]" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }: React.ComponentProps<'th'>) => (
    <th className="border-b border-border/30 bg-muted/20 px-2 py-1.5 text-left font-semibold text-foreground/80" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: React.ComponentProps<'td'>) => (
    <td className="border-b border-border/20 px-2 py-1.5 text-foreground/70" {...props}>{children}</td>
  ),
  hr: (props: React.ComponentProps<'hr'>) => (
    <hr className="my-3 border-border/20" {...props} />
  ),
  code: ({ className, children, ...props }: React.ComponentProps<'code'> & { className?: string }) => {
    const match = className?.match(/language-(\w+)/);
    const codeString = String(children).replace(/\n$/, '');

    if (match) {
      return (
        <div className="group relative my-2 rounded-lg border border-border/20 bg-[#0d1117] overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/5 px-3 py-1">
            <span className="text-[10px] text-muted-foreground/50 font-mono">{match[1]}</span>
            <CopyButton text={codeString} />
          </div>
          <pre className="overflow-x-auto p-3 text-[11px] leading-[1.6]">
            <code className={`${className} font-mono text-foreground/85`} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    }
    // Inline code
    return (
      <code className="rounded-[4px] bg-muted/30 px-1.5 py-0.5 text-[11px] font-mono text-primary/80 border border-border/20" {...props}>
        {children}
      </code>
    );
  },
};

/* ── User message ── */
function UserMessage({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="ml-auto max-w-[88%]">
      <div className="rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2 text-[12px] leading-[1.65] text-foreground/90 font-serif">
        {entry.content}
      </div>
    </div>
  );
}

/* ── AI Thinking Loader (magic-wand animation — fallback) ── */
function SkeletonLoader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-2.5 py-1 pl-0.5"
    >
      <div className="analyze">
        <svg height="24" width="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect height="24" width="24" fill="none" />
          <path className="board" strokeLinecap="round" strokeWidth="1.5" stroke="#9ca3af" d="M19.25 9.25V5.25C19.25 4.42157 18.5784 3.75 17.75 3.75H6.25C5.42157 3.75 4.75 4.42157 4.75 5.25V18.75C4.75 19.5784 5.42157 20.25 6.25 20.25H12.25" />
          <path className="star-2" d="M9.18748 11.5066C9.12305 11.3324 8.87677 11.3324 8.81234 11.5066L8.49165 12.3732C8.47139 12.428 8.42823 12.4711 8.37348 12.4914L7.50681 12.8121C7.33269 12.8765 7.33269 13.1228 7.50681 13.1872L8.37348 13.5079C8.42823 13.5282 8.47139 13.5714 8.49165 13.6261L8.81234 14.4928C8.87677 14.6669 9.12305 14.6669 9.18748 14.4928L9.50818 13.6261C9.52844 13.5714 9.5716 13.5282 9.62634 13.5079L10.493 13.1872C10.6671 13.1228 10.6671 12.8765 10.493 12.8121L9.62634 12.4914C9.5716 12.4711 9.52844 12.428 9.50818 12.3732L9.18748 11.5066Z" />
          <path className="star-1" d="M11.7345 6.63394C11.654 6.41629 11.3461 6.41629 11.2656 6.63394L10.8647 7.71728C10.8394 7.78571 10.7855 7.83966 10.717 7.86498L9.6337 8.26585C9.41605 8.34639 9.41605 8.65424 9.6337 8.73478L10.717 9.13565C10.7855 9.16097 10.8394 9.21493 10.8647 9.28335L11.2656 10.3667C11.3461 10.5843 11.654 10.5843 11.7345 10.3667L12.1354 9.28335C12.1607 9.21493 12.2147 9.16097 12.2831 9.13565L13.3664 8.73478C13.5841 8.65424 13.5841 8.34639 13.3664 8.26585L12.2831 7.86498C12.2147 7.83966 12.1607 7.78571 12.1354 7.71728L11.7345 6.63394Z" />
          <path className="stick" strokeLinecap="round" strokeWidth="1.5" stroke="#9ca3af" d="M17 14L21.2929 18.2929C21.6834 18.6834 21.6834 19.3166 21.2929 19.7071L20.7071 20.2929C20.3166 20.6834 19.6834 20.6834 19.2929 20.2929L15 16M17 14L15.7071 12.7071C15.3166 12.3166 14.6834 12.3166 14.2929 12.7071L13.7071 13.2929C13.3166 13.6834 13.3166 14.3166 13.7071 14.7071L15 16M17 14L15 16" />
        </svg>
      </div>
      <span className="text-[10px] font-medium tracking-wider text-muted-foreground/60 font-sans">
        AI 正在思考…
      </span>
    </motion.div>
  );
}

/* ── Empty state ── */
function EmptyState({ lastPrompt, scrollRef }: { lastPrompt: string; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative mb-5"
        >
          <div className="node-paper-bg flex h-12 w-12 items-center justify-center rounded-xl border-[1.5px] border-border/50 shadow-sm">
            <StudySoloIcon className="h-5 w-5 text-primary stroke-[1.5]" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-[13px] font-bold text-foreground/90 font-serif">准备就绪</h3>
          <p className="mt-1.5 max-w-[200px] text-[11px] leading-relaxed text-muted-foreground/80 font-serif">
            描述你的学习目标，我将为你构建工作流。
            <br />也可以对话讨论或修改已有节点。
          </p>
        </motion.div>
        {lastPrompt ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center gap-1.5 rounded-lg border-[1.5px] border-border/50 node-paper-bg px-2.5 py-1.5 shadow-sm"
          >
            <History className="h-3 w-3 text-muted-foreground stroke-[1.5]" />
            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[180px]">
              {lastPrompt.slice(0, 40)}{lastPrompt.length > 40 ? '...' : ''}
            </span>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}

/* ── Main Component ── */
export function ChatMessages({ history, loading, streaming, streamingMessageId, lastPrompt, scrollRef }: ChatMessagesProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth' });
    }
  }, [history, streaming]);

  if (history.length === 0) {
    return <EmptyState lastPrompt={lastPrompt} scrollRef={scrollRef} />;
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="space-y-5 p-4">
        <AnimatePresence initial={false}>
          {history.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {entry.role === 'user' ? (
                <UserMessage entry={entry} />
              ) : (
                <AIMessage
                  entry={entry}
                  isStreaming={streaming && entry.id === streamingMessageId}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading skeleton (before streaming starts) */}
        {loading && !streaming && <SkeletonLoader />}

        <div ref={endRef} />
      </div>
    </div>
  );
}
