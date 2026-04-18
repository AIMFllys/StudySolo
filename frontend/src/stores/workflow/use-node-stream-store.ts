'use client';

/**
 * useNodeStreamStore — 节点流式输出隔离存储.
 *
 * 为什么独立于 useWorkflowStore：
 *  - 工作流运行时每秒会产生几十个 LLM token，若直接写入 `useWorkflowStore.nodes`，
 *    任何订阅 `nodes` 的组件（画布、节点列表、侧边栏派生状态）都会高频重渲，
 *    进而和聊天历史 / Markdown 渲染抢占主线程，造成"开始工作流后界面卡死"。
 *  - 独立 store 只驱动 **单个节点渲染器** 的订阅者，避免广播式的全局重渲。
 *
 * 生命周期约定：
 *  - `use-workflow-execution.ts` 在收到 `node_token` 时向此 store 追加片段（rAF 合批）。
 *  - 终端事件（`node_done` / 终态 `node_status` / `workflow_done`）会把累计值提交到
 *    `useWorkflowStore`，然后清理本 store 对应条目，使其成为最终真源。
 */

import { useSyncExternalStore } from 'react';

type Listener = () => void;

// 为了避免结构化相等的开销，使用"版本号 + 值"的模式：
// 每次追加都递增 version，useSyncExternalStore 通过 getSnapshot 对比版本变更。
// 仅订阅特定 nodeId 的组件不会因其他节点的更新而重渲。
interface NodeStreamEntry {
  value: string;
  version: number;
}

class NodeStreamStore {
  private entries = new Map<string, NodeStreamEntry>();
  private listeners = new Map<string, Set<Listener>>();

  /** 订阅某个节点的流式输出变更。返回解除订阅函数。 */
  subscribe(nodeId: string, listener: Listener): () => void {
    let set = this.listeners.get(nodeId);
    if (!set) {
      set = new Set();
      this.listeners.set(nodeId, set);
    }
    set.add(listener);
    return () => {
      const s = this.listeners.get(nodeId);
      if (!s) return;
      s.delete(listener);
      if (s.size === 0) this.listeners.delete(nodeId);
    };
  }

  private notify(nodeId: string) {
    const set = this.listeners.get(nodeId);
    if (!set) return;
    for (const listener of set) listener();
  }

  /** 获取当前快照（undefined 表示该节点没有流式输出）。 */
  get(nodeId: string): string | undefined {
    return this.entries.get(nodeId)?.value;
  }

  /** 追加 token。空 token 会被忽略。 */
  append(nodeId: string, token: string): void {
    if (!token) return;
    const prev = this.entries.get(nodeId);
    const next: NodeStreamEntry = {
      value: (prev?.value ?? '') + token,
      version: (prev?.version ?? 0) + 1,
    };
    this.entries.set(nodeId, next);
    this.notify(nodeId);
  }

  /** 清理某个节点的流式条目（通常在终态事件或新一轮运行开始时调用）。 */
  clear(nodeId: string): void {
    if (!this.entries.has(nodeId)) return;
    this.entries.delete(nodeId);
    this.notify(nodeId);
  }

  /** 清理所有节点的流式条目。 */
  clearAll(): void {
    if (this.entries.size === 0) return;
    const ids = Array.from(this.entries.keys());
    this.entries.clear();
    for (const id of ids) this.notify(id);
  }
}

export const nodeStreamStore = new NodeStreamStore();

/**
 * React hook：订阅某个节点的实时流式输出。
 * 返回 `string | undefined`——undefined 表示当前没有未提交的流式片段，
 * 调用方应回退到 `useWorkflowStore` 中的 `node.data.output`（即最终持久化值）。
 */
export function useNodeStreamOutput(nodeId: string): string | undefined {
  return useSyncExternalStore(
    (listener) => nodeStreamStore.subscribe(nodeId, listener),
    () => nodeStreamStore.get(nodeId),
    () => undefined,
  );
}
