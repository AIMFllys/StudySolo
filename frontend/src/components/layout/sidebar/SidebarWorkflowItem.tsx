'use client';

import Link from 'next/link';
import { formatMonthDay } from '@/utils/date';
import type { WorkflowMeta } from '../Sidebar';

interface SidebarWorkflowItemProps {
  workflow: WorkflowMeta;
  active: boolean;
  onContextMenu: (event: React.MouseEvent, workflowId: string) => void;
}

export function SidebarWorkflowItem({
  workflow,
  active,
  onContextMenu,
}: SidebarWorkflowItemProps) {
  return (
    <Link
      href={`/workspace/${workflow.id}`}
      onContextMenu={(event) => onContextMenu(event, workflow.id)}
      className={`group relative mx-2 my-1 flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 border-[1.5px] ${
        active
          ? 'bg-primary/5 border-primary/20 text-primary shadow-sm'
          : 'border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
      }`}
    >
      <span className="relative shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-current"
        >
          <rect
            x="1.5"
            y="1.5"
            width="13"
            height="13"
            rx="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}
          />
          <path
            d="M4.5 5.5h7M4.5 8h5M4.5 10.5h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {workflow.isRunning ? (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-accent" />
        ) : null}
      </span>

      <div className="hidden min-w-0 flex-1 lg:block">
        <p className={`truncate text-sm font-medium leading-tight transition-colors ${active ? 'text-primary' : 'text-foreground group-hover:text-foreground'}`}>{workflow.name}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {formatMonthDay(workflow.updated_at, 'zh-CN')}
        </p>
      </div>
    </Link>
  );
}
