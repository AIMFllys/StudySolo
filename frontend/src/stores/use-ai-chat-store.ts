'use client';

import { create } from 'zustand';
import type { ChatEntry } from '@/features/workflow/hooks/use-conversation-store';
import { useConversationStore } from '@/features/workflow/hooks/use-conversation-store';
import { useWorkflowStore } from '@/stores/use-workflow-store';
import { executeCanvasActions, type CanvasAction } from '@/features/workflow/hooks/use-action-executor';
import type { AIMode, ThinkingDepth } from '@/components/layout/sidebar/SidebarAIPanel';
import type { AIModelOption } from '@/features/workflow/constants/ai-models';
import { DEFAULT_MODEL } from '@/features/workflow/constants/ai-models';
import type { CanvasContext } from '@/features/workflow/hooks/use-canvas-context';
import type { Node, Edge } from '@xyflow/react';

export interface StreamChatSendOptions {
  userInput: string;
  canvasContext: CanvasContext | null;
  history: ChatEntry[];
  intentHint?: string | null;
}

interface GenerateResponse {
  nodes: Node[];
  edges: Edge[];
  implicit_context: Record<string, unknown>;
}

export interface AIChatState {
  input: string;
  loading: boolean;
  streaming: boolean;
  streamingMessageId: string | null;
  error: string | null;
  history: ChatEntry[];
  mode: AIMode;
  thinkingDepth: ThinkingDepth;
  selectedModel: AIModelOption;
  
  // Abort controller holds the current streaming request signal
  abortController: AbortController | null;

  setInput: (input: string) => void;
  setMode: (mode: AIMode) => void;
  setThinkingDepth: (depth: ThinkingDepth) => void;
  setSelectedModel: (model: AIModelOption) => void;
  setError: (error: string | null) => void;
  
  // Sync history locally and create/switch conversation if needed
  syncHistory: (messages: ChatEntry[]) => void;
  pushMessage: (role: 'user' | 'assistant', content: string) => string;
  updateMessage: (id: string, newContent: string) => void;
  clearHistory: () => void;

  abortStream: () => void;
  sendStream: (opts: StreamChatSendOptions) => Promise<void>;
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  input: '',
  loading: false,
  streaming: false,
  streamingMessageId: null,
  error: null,
  history: [],
  mode: 'chat',
  thinkingDepth: 'balanced',
  selectedModel: DEFAULT_MODEL,
  abortController: null,

  setInput: (input) => set({ input }),
  setMode: (mode) => set({ mode }),
  setThinkingDepth: (thinkingDepth) => set({ thinkingDepth }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setError: (error) => set({ error }),

  syncHistory: (messages) => set({ history: messages }),

  pushMessage: (role, content) => {
    const entry: ChatEntry = { id: crypto.randomUUID(), role, content, timestamp: Date.now() };
    set((state) => ({ history: [...state.history, entry] }));
    
    // Add to persistent storage
    const convStore = useConversationStore.getState();
    if (!convStore.activeId) {
      convStore.createConversation();
    }
    convStore.appendMessage(entry);
    return entry.id;
  },

  updateMessage: (id, newContent) => {
    set((state) => ({
      history: state.history.map((m) => (m.id === id ? { ...m, content: newContent } : m)),
    }));
  },

  clearHistory: () => set({ history: [], error: null }),

  abortStream: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ streaming: false, loading: false, streamingMessageId: null });
  },

  sendStream: async (opts) => {
    const { userInput, canvasContext, history, intentHint } = opts;
    const state = get();
    
    // Abort previous stream if any
    state.abortStream();

    const ctrl = new AbortController();
    
    // Setup state for new stream
    const assistantMsgId = crypto.randomUUID();
    
    set((s) => ({
      abortController: ctrl,
      loading: true,
      streaming: true,
      streamingMessageId: assistantMsgId,
      error: null,
      history: [...s.history, { id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() }],
    }));

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
      mode: state.mode,
      selected_model_key: state.selectedModel.skuId,
      selected_model: state.selectedModel.modelId,
      selected_platform: state.selectedModel.provider,
      thinking_level: state.thinkingDepth,
    };

    let fullText = '';
    let intent = 'CHAT';

    const finishCall = async (finalText: string, finalIntent: string) => {
      set({ streaming: false, loading: false, streamingMessageId: null });
      
      // Update persistent store with the complete assistant message once streaming finishes
      const convStore = useConversationStore.getState();
      if (!convStore.activeId) {
        convStore.createConversation();
      }
      convStore.appendMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: finalText,
        timestamp: Date.now(),
      });

      // Background actions handling based on intent
      if (finalIntent === 'MODIFY') {
        try {
          const p = JSON.parse(finalText) as { actions?: CanvasAction[]; response?: string };
          const a = p.actions ?? [];
          if (a.length > 0) {
            // NOTE: We stripped the `confirm` window logic because we run in the background. 
            // The actions can be gracefully undone if they delete nodes. 
            const r = await executeCanvasActions(a);
            const msgUpdate = r.success ? `✅ ${p.response || '完成'} (${r.appliedCount}步)` : `⚠️ ${r.error}`;
            get().updateMessage(assistantMsgId, msgUpdate);
            // Re-sync with conversation store
            convStore.appendMessage({ id: assistantMsgId, role: 'assistant', content: msgUpdate, timestamp: Date.now() });
          }
        } catch {
          // If parse fails, keep the raw JSON visible, it's fine.
        }
      } else if (finalIntent === 'BUILD') {
        const wfStore = useWorkflowStore.getState();
        wfStore.replaceWorkflowGraph([{ id: 'generating-node', position: { x: 300, y: 200 }, type: 'generating', data: {} }], []);
        try {
          const r = await fetch('/api/ai/generate-workflow', { 
            method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ user_input: userInput, thinking_level: state.thinkingDepth }) 
          });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const d: GenerateResponse = await r.json();
          wfStore.replaceWorkflowGraph(d.nodes, d.edges);
          wfStore.setGenerationContext(userInput, d.implicit_context);
          
          const successMsg = `✅ 已生成 ${d.nodes.length} 个节点。`;
          get().updateMessage(assistantMsgId, successMsg);
          convStore.appendMessage({ id: assistantMsgId, role: 'assistant', content: successMsg, timestamp: Date.now() });
        } catch (e: unknown) {
          const failMsg = `❌ ${e instanceof Error ? e.message : '失败'}`;
          get().updateMessage(assistantMsgId, failMsg);
          convStore.appendMessage({ id: assistantMsgId, role: 'assistant', content: failMsg, timestamp: Date.now() });
        }
      }
    };

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
        get().updateMessage(assistantMsgId, fullText);
        await finishCall(fullText, intent);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        set({ loading: false }); // First chunk arrived

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data:')) {
            const raw = trimmedLine.slice(5).trim();
            if (raw === '[DONE]') { await reader.cancel(); break; }
            try {
              const parsed = JSON.parse(raw) as Record<string, unknown>;
              if (parsed.intent) intent = parsed.intent as string;
              
              if (parsed.done && (intent === 'MODIFY' || intent === 'BUILD')) {
                fullText = JSON.stringify(parsed);
                get().updateMessage(assistantMsgId, fullText);
                await reader.cancel();
                break;
              }
              
              if (parsed.token) {
                fullText += parsed.token as string;
                get().updateMessage(assistantMsgId, fullText);
              }
              if (parsed.done) { await reader.cancel(); break; }
            } catch { /* skip partial JSON */ }
          }
        }
      }

      await finishCall(fullText || '（已完成）', intent);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      const errorMsg = err instanceof Error ? err.message : '请求失败';
      set({ error: errorMsg, loading: false, streaming: false, streamingMessageId: null });
      get().updateMessage(assistantMsgId, `❌ ${errorMsg}`);
    }
  },
}));
