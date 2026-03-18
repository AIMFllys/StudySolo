import type { Edge, Node } from '@xyflow/react';

/**
 * 工作流节点类型枚举
 *
 * ── 原始节点 (9) ──
 * trigger_input   — 用户输入触发
 * ai_analyzer     — 需求分析器
 * ai_planner      — 工作流规划器
 * outline_gen     — 大纲生成
 * content_extract — 知识提炼
 * summary         — 总结归纳
 * flashcard       — 闪卡生成
 * chat_response   — 回复用户
 * write_db        — 数据写入
 *
 * ── P1 新增节点 (7) ──
 * compare         — 对比分析
 * mind_map        — 思维导图
 * quiz_gen        — 测验生成
 * merge_polish    — 合并润色
 * knowledge_base  — 知识库检索
 * web_search      — 网络搜索
 * export_file     — 文件导出
 *
 * ── P2 引擎节点 (2) ──
 * logic_switch    — 逻辑分支
 * loop_map        — 循环映射
 */
export type NodeType =
  | 'trigger_input'
  | 'ai_analyzer'
  | 'ai_planner'
  | 'outline_gen'
  | 'content_extract'
  | 'summary'
  | 'flashcard'
  | 'chat_response'
  | 'write_db'
  // ── P1 节点 ──
  | 'compare'
  | 'mind_map'
  | 'quiz_gen'
  | 'merge_polish'
  | 'knowledge_base'
  | 'web_search'
  | 'export_file'
  // ── P2 引擎节点 ──
  | 'logic_switch'
  | 'loop_map';

/** 节点生命周期状态 */
export type NodeStatus = 'pending' | 'running' | 'done' | 'error' | 'paused';

/** AI 步骤节点数据（存储在 WorkflowNode.data 中） */
export interface AIStepNodeData {
  label: string;
  type?: NodeType;
  system_prompt: string;
  model_route: string;
  status: NodeStatus;
  output: string;
  error?: string;
  output_format?: string;
}

/** 工作流节点（存储在 nodes_json JSONB 中） */
export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: AIStepNodeData;
}

/**
 * 连线类型
 * sequential  — 顺序流: 做完 A → 接着做 B (实心手绘线)
 * conditional — 条件分支: 满足条件走此路径 (虚线+标签)
 * loop        — 循环迭代: 对集合中每项重复处理 (波浪线)
 */
export type EdgeType = 'sequential' | 'conditional' | 'loop';

/** Handle 方位 ID (4 方位 × source/target = 8 个) */
export type HandlePosition =
  | 'source-top'
  | 'source-right'
  | 'source-bottom'
  | 'source-left'
  | 'target-top'
  | 'target-right'
  | 'target-bottom'
  | 'target-left';

/** 连线附加数据 */
export interface WorkflowEdgeData {
  /** 连线标签文字 (条件线必填，其他可选) */
  label?: string;
  /** 条件分支名 (后端 executor 使用) */
  branch?: string;
  /** 循环迭代次数上限 */
  maxIterations?: number;
}

/** 工作流连线（存储在 edges_json JSONB 中） */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: HandlePosition;
  targetHandle?: HandlePosition;
  type?: EdgeType;
  data?: WorkflowEdgeData;
}

/** 兼容旧数据 — 为缺失字段补充默认值 */
export function normalizeEdge(edge: Partial<WorkflowEdge> & { id: string; source: string; target: string }): WorkflowEdge {
  return {
    ...edge,
    type: edge.type || 'sequential',
    sourceHandle: edge.sourceHandle || 'source-right',
    targetHandle: edge.targetHandle || 'target-left',
    data: edge.data || {},
  };
}

export interface WorkflowMeta {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowContent {
  id: string;
  name: string;
  nodes_json: Node[];
  edges_json: Edge[];
}
