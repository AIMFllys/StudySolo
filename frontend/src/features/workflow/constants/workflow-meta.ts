import type { Node } from '@xyflow/react';
import type { AIStepNodeData, NodeStatus, NodeType } from '@/types';

type StatusMeta = {
  badgeClassName: string;
  dotClassName: string;
  label: string;
};

type NodeTypeMeta = {
  accentClassName: string;
  description: string;
  icon: string;
  label: string;
};

type WorkflowNodeLike = Pick<Node, 'id' | 'type'> & {
  data?: Partial<AIStepNodeData>;
};

export const STATUS_META: Record<NodeStatus, StatusMeta> = {
  pending: {
    label: '待执行',
    badgeClassName: 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-400/20',
    dotClassName: 'bg-slate-400',
  },
  running: {
    label: '执行中',
    badgeClassName: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30',
    dotClassName: 'bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.75)]',
  },
  done: {
    label: '已完成',
    badgeClassName: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/25',
    dotClassName: 'bg-emerald-400',
  },
  error: {
    label: '错误',
    badgeClassName: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30',
    dotClassName: 'bg-rose-400',
  },
  paused: {
    label: '已暂停',
    badgeClassName: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25',
    dotClassName: 'bg-amber-400',
  },
};

export const NODE_TYPE_META: Record<NodeType, NodeTypeMeta> = {
  trigger_input: {
    label: '输入触发',
    icon: 'play_arrow',
    description: '接收用户目标与限制条件',
    accentClassName: 'from-cyan-500/20 to-sky-500/5 text-cyan-100 ring-cyan-400/30',
  },
  ai_analyzer: {
    label: '需求分析',
    icon: 'analytics',
    description: '抽取学习目标、约束与上下文',
    accentClassName: 'from-violet-500/20 to-indigo-500/5 text-violet-100 ring-violet-400/30',
  },
  ai_planner: {
    label: '流程规划',
    icon: 'account_tree',
    description: '决定节点拆分、连接关系与执行顺序',
    accentClassName: 'from-fuchsia-500/20 to-violet-500/5 text-fuchsia-100 ring-fuchsia-400/30',
  },
  outline_gen: {
    label: '大纲生成',
    icon: 'segment',
    description: '形成清晰的知识结构与章节顺序',
    accentClassName: 'from-indigo-500/20 to-blue-500/5 text-indigo-100 ring-indigo-400/30',
  },
  content_extract: {
    label: '内容提炼',
    icon: 'auto_stories',
    description: '提炼关键概念、案例与解释',
    accentClassName: 'from-emerald-500/20 to-green-500/5 text-emerald-100 ring-emerald-400/30',
  },
  summary: {
    label: '总结归纳',
    icon: 'docs',
    description: '整理重点、结论与复习摘要',
    accentClassName: 'from-amber-500/20 to-orange-500/5 text-amber-100 ring-amber-400/30',
  },
  flashcard: {
    label: '闪卡生成',
    icon: 'style',
    description: '转成适合记忆练习的问答卡片',
    accentClassName: 'from-rose-500/20 to-pink-500/5 text-rose-100 ring-rose-400/30',
  },
  chat_response: {
    label: '学习回复',
    icon: 'chat',
    description: '输出最终建议、答复与引导',
    accentClassName: 'from-sky-500/20 to-cyan-500/5 text-sky-100 ring-sky-400/30',
  },
  write_db: {
    label: '写入数据',
    icon: 'database',
    description: '持久化结果并同步到工作流记录',
    accentClassName: 'from-slate-500/20 to-zinc-500/5 text-slate-100 ring-slate-400/30',
  },

  // ── P1 generation 节点 ──
  compare: {
    label: '对比分析',
    icon: 'compare_arrows',
    description: '多维度内容对比分析',
    accentClassName: 'from-teal-500/20 to-emerald-500/5 text-teal-100 ring-teal-400/30',
  },
  mind_map: {
    label: '思维导图',
    icon: 'account_tree',
    description: '生成结构化思维导图',
    accentClassName: 'from-lime-500/20 to-green-500/5 text-lime-100 ring-lime-400/30',
  },
  quiz_gen: {
    label: '测验生成',
    icon: 'quiz',
    description: '生成测验题目与解析',
    accentClassName: 'from-yellow-500/20 to-amber-500/5 text-yellow-100 ring-yellow-400/30',
  },
  merge_polish: {
    label: '合并润色',
    icon: 'auto_fix_high',
    description: '整合与润色多源内容',
    accentClassName: 'from-pink-500/20 to-rose-500/5 text-pink-100 ring-pink-400/30',
  },

  // ── P1 input 节点 ──
  knowledge_base: {
    label: '知识库检索',
    icon: 'local_library',
    description: '从知识库检索相关内容',
    accentClassName: 'from-blue-500/20 to-indigo-500/5 text-blue-100 ring-blue-400/30',
  },
  web_search: {
    label: '网络搜索',
    icon: 'travel_explore',
    description: '互联网内容搜索与整合',
    accentClassName: 'from-cyan-500/20 to-blue-500/5 text-cyan-100 ring-cyan-400/30',
  },

  // ── P1 output 节点 ──
  export_file: {
    label: '文件导出',
    icon: 'download',
    description: '导出工作流结果为文件',
    accentClassName: 'from-gray-500/20 to-slate-500/5 text-gray-100 ring-gray-400/30',
  },

  // ── P2 analysis 节点 ──
  logic_switch: {
    label: '逻辑分支',
    icon: 'call_split',
    description: '基于条件动态路由',
    accentClassName: 'from-orange-500/20 to-amber-500/5 text-orange-100 ring-orange-400/30',
  },
  loop_map: {
    label: '循环映射',
    icon: 'all_inclusive',
    description: '循环处理列表数据',
    accentClassName: 'from-red-500/20 to-orange-500/5 text-red-100 ring-red-400/30',
  },
};

export function getStatusMeta(status?: string) {
  return STATUS_META[(status as NodeStatus) ?? 'pending'] ?? STATUS_META.pending;
}

export function getNodeTypeMeta(nodeType?: string) {
  return NODE_TYPE_META[(nodeType as NodeType) ?? 'chat_response'] ?? NODE_TYPE_META.chat_response;
}

export function getNodePreview(output?: string, fallback = '等待该步骤生成内容') {
  const normalized = (output ?? '')
    .replace(/```[\s\S]*?```/g, '代码块')
    .replace(/[#>*`_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.slice(0, 96);
}

export function getNodeTitle(node: WorkflowNodeLike) {
  return node.data?.label?.trim() || getNodeTypeMeta(node.data?.type ?? node.type).label;
}
