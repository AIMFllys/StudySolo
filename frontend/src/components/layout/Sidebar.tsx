'use client';

import Link from 'next/link';
import { LayoutList, BookOpen, Settings, LogOut } from 'lucide-react';
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation';
import { useWorkflowContextMenu } from '@/features/workflow/hooks/use-workflow-context-menu';
import { useWorkflowSidebarActions } from '@/features/workflow/hooks/use-workflow-sidebar-actions';
import { SidebarContextMenu } from './sidebar/SidebarContextMenu';
import { SidebarWorkflowItem } from './sidebar/SidebarWorkflowItem';

export interface WorkflowMeta {
  id: string;
  name: string;
  updated_at: string;
  isRunning?: boolean;
}

interface SidebarProps {
  workflows: WorkflowMeta[];
}

export default function Sidebar({ workflows }: SidebarProps) {
  const { pathname, settingsActive, knowledgeActive, isWorkflowActive, logoutAndRedirect } =
    useSidebarNavigation();
  const { contextMenu, handleContextMenu, closeContextMenu } =
    useWorkflowContextMenu();
  const { processingWorkflowId, onRenameWorkflow, onDeleteWorkflow } =
    useWorkflowSidebarActions(pathname, closeContextMenu);

  function handleRename(workflowId: string) {
    const workflow = workflows.find((item) => item.id === workflowId);
    void onRenameWorkflow(workflowId, workflow?.name ?? '未命名工作流');
  }

  function handleDelete(workflowId: string) {
    const workflow = workflows.find((item) => item.id === workflowId);
    void onDeleteWorkflow(workflowId, workflow?.name ?? '未命名工作流');
  }

  return (
    <>
      <aside className="flex h-full w-16 shrink-0 flex-col border-r border-border bg-background transition-all duration-200 lg:w-[280px]">
        <div className="flex items-center gap-2 border-b border-border px-3 py-3">
          <LayoutList className="w-5 h-5 shrink-0 text-primary" />
          <span className="hidden text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:block">
            工作流
          </span>
        </div>

        <nav className="scrollbar-hide flex-1 overflow-y-auto py-2">
          {workflows.length === 0 ? (
            <p className="hidden px-4 py-3 text-xs text-muted-foreground lg:block">
              暂无工作流
            </p>
          ) : null}
          {workflows.map((workflow) => (
            <SidebarWorkflowItem
              key={workflow.id}
              workflow={workflow}
              active={isWorkflowActive(workflow.id)}
              onContextMenu={handleContextMenu}
            />
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-border p-2">
          <Link
            href="/knowledge"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${knowledgeActive
              ? 'bg-white/5 text-foreground'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
          >
            <BookOpen className="w-[18px] h-[18px] shrink-0" />
            <span className="hidden text-sm lg:block">知识库</span>
          </Link>

          <Link
            href="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${settingsActive
              ? 'bg-white/5 text-foreground'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
          >
            <Settings className="w-[18px] h-[18px] shrink-0" />
            <span className="hidden text-sm lg:block">设置</span>
          </Link>

          <button
            onClick={() => {
              void logoutAndRedirect();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span className="hidden text-sm lg:block">退出登录</span>
          </button>
        </div>
      </aside>

      {contextMenu ? (
        <SidebarContextMenu
          contextMenu={contextMenu}
          processingWorkflowId={processingWorkflowId}
          onClose={closeContextMenu}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      ) : null}
    </>
  );
}
