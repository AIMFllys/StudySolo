'use client';

/**
 * useStreamChat — 流式 AI 对话 Hook.
 *
 * 对 /api/ai/chat-stream 端点使用 ReadableStream 解析 SSE token,
 * 实时 append 到 message content 生成流式打字效果。
 * 支持中止 (AbortController) + 思考深度。
 */

import { useState, useRef, useCallback } from 'react';
import type { CanvasContext } from './use-canvas-context';
import type { AIModelOption } from '@/features/workflow/constants/ai-models';
import type { ChatEntry } from './use-conversation-store';
import type { ThinkingDepth } from '@/components/layout/sidebar/SidebarAIPanel';

export interface StreamChatOptions {
  userInput: string;
  canvasContext: CanvasContext | null;
  history: ChatEntry[];
  intentHint?: string | null;
  selectedModel: AIModelOption;
  thinkingDepth?: ThinkingDepth;
  onToken: (token: string) => void;
  onDone: (fullText: string, intent: string) => void;
  onError: (err: string) => void;
}

export function useStreamChat() {
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (opts: StreamChatOptions) => {
    const {
      userInput, canvasContext, history, intentHint,
      selectedModel, thinkingDepth, onToken, onDone, onError,
    } = opts;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setStreaming(true);

    const body = {
      user_input: userInput,
      canvas_context: canvasContext && canvasContext.nodesSummary.length > 0 ? {
        workflow_id: canvasContext.workflowId,
        workflow_name: canvasContext.workflowName,
        nodes: canvasContext.nodesSummary.map((n) => ({
          id: n.id, index: n.index, label: n.label, type: n.type,
          status: n.status, has_output: n.hasOutput,
          output_preview: n.outputPreview,
          upstream_labels: n.upstreamLabels,
          downstream_labels: n.downstreamLabels,
          position: n.position,
        })),
        dag_description: canvasContext.dagDescription,
        selected_node_id: canvasContext.selectedNodeId,
        execution_status: canvasContext.executionStatus,
      } : null,
      conversation_history: history.slice(-10).map((h) => ({
        role: h.role, content: h.content, timestamp: h.timestamp,
      })),
      intent_hint: intentHint,
      selected_model: selectedModel.model,
      selected_platform: selectedModel.platform,
      thinking_level: thinkingDepth ?? 'balanced',
    };

    let fullText = '';
    let intent = 'CHAT';

    try {
      const res = await fetch('/api/ai/chat-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({})) as { response?: string; intent?: string; detail?: string };
        if (data.detail) throw new Error(data.detail);
        fullText = data.response ?? '';
        intent = data.intent ?? 'CHAT';
        onDone(fullText, intent);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') { await reader.cancel(); break; }
            try {
              const parsed = JSON.parse(raw) as Record<string, unknown>;
              if (parsed.intent) intent = parsed.intent as string;
              // MODIFY/BUILD: single JSON event
              if (parsed.done && (intent === 'MODIFY' || intent === 'BUILD')) {
                fullText = JSON.stringify(parsed);
                await reader.cancel();
                break;
              }
              // CHAT: stream tokens
              if (parsed.token) {
                fullText += parsed.token as string;
                onToken(parsed.token as string);
              }
              if (parsed.done) { await reader.cancel(); break; }
            } catch { /* partial JSON, skip */ }
          }
        }
      }

      onDone(fullText || '（已完成）', intent);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      onError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setStreaming(false);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { streaming, send, abort };
}
