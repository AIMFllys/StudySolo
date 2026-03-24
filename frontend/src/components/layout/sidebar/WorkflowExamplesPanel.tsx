'use client';

import { FileText, ArrowRight, Star, Clock } from 'lucide-react';

/** 模拟数据 — 后端 API 就绪后替换 */
const MOCK_EXAMPLES = [
  {
    id: 'ex-1',
    name: '英语四级备考计划',
    description: '从词汇到阅读的完整学习路径',
    author: 'StudySolo 官方',
    stars: 128,
    category: '语言学习',
  },
  {
    id: 'ex-2',
    name: '数据结构课程笔记',
    description: '从链表到图论的知识体系梳理',
    author: 'StudySolo 官方',
    stars: 96,
    category: '计算机科学',
  },
  {
    id: 'ex-3',
    name: '考研政治思维导图',
    description: '马原+毛概重点知识结构化整理',
    author: '社区贡献',
    stars: 64,
    category: '考研备考',
  },
  {
    id: 'ex-4',
    name: '论文阅读笔记模板',
    description: '学术论文精读 + 关键观点提炼',
    author: 'StudySolo 官方',
    stars: 52,
    category: '学术研究',
  },
];

export default function WorkflowExamplesPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-3 px-1 text-[10px] text-muted-foreground">
          浏览示例工作流，一键导入到你的工作区
        </p>
        <div className="space-y-2">
          {MOCK_EXAMPLES.map((example) => (
            <button
              key={example.id}
              type="button"
              className="node-paper-bg group flex w-full flex-col gap-1.5 rounded-xl border-[1.5px] border-border/50 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all p-3 text-left"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-foreground stroke-[1.5]" />
                  <span className="text-xs font-semibold font-serif text-foreground">{example.name}</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 stroke-[1.5]" />
              </div>
              <p className="text-[10.5px] leading-snug text-muted-foreground font-serif">{example.description}</p>
              <div className="mt-1 pt-1.5 border-t border-dashed border-border/50 flex items-center justify-between w-full text-[10px] text-muted-foreground font-mono tracking-tight">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5 stroke-[1.5]" />
                    {example.author}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5 stroke-[1.5]" />
                    {example.stars}
                  </span>
                </div>
                <span className="rounded-lg border-[1.5px] border-border/50 bg-muted/50 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground tracking-wider shadow-sm">
                  {example.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
