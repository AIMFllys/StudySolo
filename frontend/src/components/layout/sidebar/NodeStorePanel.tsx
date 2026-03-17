'use client';

import { useCallback, useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { NODE_TYPE_META } from '@/features/workflow/constants/workflow-meta';
import type { NodeType } from '@/types';

/** 节点分类 */
const NODE_CATEGORIES: { label: string; types: NodeType[] }[] = [
  {
    label: '输入 & 触发',
    types: ['trigger_input'],
  },
  {
    label: 'AI 处理',
    types: ['ai_analyzer', 'ai_planner', 'content_extract', 'merge_polish'],
  },
  {
    label: '内容生成',
    types: ['outline_gen', 'summary', 'flashcard', 'quiz_gen', 'mind_map', 'chat_response'],
  },
  {
    label: '数据 & 集成',
    types: ['knowledge_base', 'web_search', 'write_db', 'export_file'],
  },
  {
    label: '逻辑控制',
    types: ['compare', 'logic_switch', 'loop_map'],
  },
];

interface NodeStoreItemProps {
  nodeType: NodeType;
}

function NodeStoreItem({ nodeType }: NodeStoreItemProps) {
  const meta = NODE_TYPE_META[nodeType];

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      // Set the node type as drag data — WorkflowCanvas onDrop handler reads this
      e.dataTransfer.setData('application/studysolo-node-type', nodeType);
      e.dataTransfer.effectAllowed = 'move';
    },
    [nodeType]
  );

  const handleClick = useCallback(() => {
    // Dispatch custom event for canvas to add node at center
    window.dispatchEvent(
      new CustomEvent('node-store:add-node', {
        detail: { nodeType },
      })
    );
  }, [nodeType]);

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5 active:scale-[0.98]"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1 ${meta.accentClassName}`}
      >
        <meta.icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-foreground">{meta.label}</p>
        <p className="truncate text-[10px] text-muted-foreground">{meta.description}</p>
      </div>
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

export default function NodeStorePanel() {
  const categories = useMemo(() => NODE_CATEGORIES, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-3 px-1 text-[10px] text-muted-foreground">
          拖拽节点到画布，或点击添加到中央
        </p>
        {categories.map((category) => (
          <div key={category.label} className="mb-3">
            <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/70">
              {category.label}
            </p>
            <div className="space-y-0.5">
              {category.types.map((nodeType) => (
                <NodeStoreItem key={nodeType} nodeType={nodeType} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
