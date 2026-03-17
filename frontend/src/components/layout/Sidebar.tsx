'use client';

import Link from 'next/link';
import {
  LayoutList,
  Sparkles,
  Store,
  BookTemplate,
  LayoutDashboard,
  Puzzle,
  Wallet,
  Settings,
  LogOut,
  BookOpenText,
  UserCircle,
} from 'lucide-react';
import { useSidebarNavigation } from '@/hooks/use-sidebar-navigation';
import { useWorkflowContextMenu } from '@/features/workflow/hooks/use-workflow-context-menu';
import { useWorkflowSidebarActions } from '@/features/workflow/hooks/use-workflow-sidebar-actions';
import { usePanelStore, type SidebarPanel, LEFT_PANEL_MIN, LEFT_PANEL_MAX } from '@/stores/use-panel-store';
import { SidebarContextMenu } from './sidebar/SidebarContextMenu';
import { SidebarWorkflowItem } from './sidebar/SidebarWorkflowItem';
import { SidebarAIPanel } from './sidebar/SidebarAIPanel';
import NodeStorePanel from './sidebar/NodeStorePanel';
import WorkflowExamplesPanel from './sidebar/WorkflowExamplesPanel';
import DashboardPanel from './sidebar/DashboardPanel';
import WalletPanel from './sidebar/WalletPanel';
import PluginsPanel from './sidebar/PluginsPanel';
import ResizableHandle from './ResizableHandle';
import type { LucideIcon } from 'lucide-react';

export interface WorkflowMeta {
  id: string;
  name: string;
  updated_at: string;
  isRunning?: boolean;
}

interface SidebarProps {
  workflows: WorkflowMeta[];
}

/* ─── Panel config — upper zone (core feature panels) ─── */
const UPPER_PANELS: { panel: SidebarPanel; icon: LucideIcon; label: string }[] = [
  { panel: 'workflows', icon: LayoutList, label: '工作流' },
  { panel: 'ai-chat', icon: Sparkles, label: 'AI 对话' },
  { panel: 'node-store', icon: Store, label: '节点商店' },
  { panel: 'workflow-examples', icon: BookTemplate, label: '工作流样例' },
  { panel: 'dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { panel: 'plugins', icon: Puzzle, label: '插件' },
];

/* ─── Panel config — lower zone (tools/settings) ─── */
const LOWER_PANELS: { panel: SidebarPanel; icon: LucideIcon; label: string }[] = [
  { panel: 'wallet', icon: Wallet, label: '钱包设置' },
];

/** Get the panel label for the active panel */
function getPanelLabel(panel: SidebarPanel): string {
  const all = [...UPPER_PANELS, ...LOWER_PANELS];
  return all.find((p) => p.panel === panel)?.label ?? '';
}

export default function Sidebar({ workflows }: SidebarProps) {
  const { pathname, settingsActive, isWorkflowActive, logoutAndRedirect } =
    useSidebarNavigation();
  const { contextMenu, handleContextMenu, closeContextMenu } =
    useWorkflowContextMenu();
  const { processingWorkflowId, onRenameWorkflow, onDeleteWorkflow } =
    useWorkflowSidebarActions(pathname, closeContextMenu);

  const {
    activeSidebarPanel,
    toggleSidebarPanel,
    leftPanelWidth,
    setLeftPanelWidth,
  } = usePanelStore();
  const isCollapsed = activeSidebarPanel === null;

  function handleRename(workflowId: string) {
    const workflow = workflows.find((item) => item.id === workflowId);
    void onRenameWorkflow(workflowId, workflow?.name ?? '未命名工作流');
  }

  function handleDelete(workflowId: string) {
    const workflow = workflows.find((item) => item.id === workflowId);
    void onDeleteWorkflow(workflowId, workflow?.name ?? '未命名工作流');
  }

  function renderActivityButton(
    panel: SidebarPanel,
    icon: LucideIcon,
    label: string
  ) {
    const Icon = icon;
    const isActive = activeSidebarPanel === panel;
    return (
      <button
        key={panel}
        type="button"
        onClick={() => toggleSidebarPanel(panel)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
          isActive
            ? 'bg-white/8 text-foreground'
            : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
        }`}
        title={label}
      >
        <Icon className="h-[18px] w-[18px]" />
        {isActive && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
        )}
      </button>
    );
  }

  return (
    <>
      <div className="flex h-full shrink-0 border-r border-border">
        {/* ─── Activity Bar (always visible, fixed width) ─── */}
        <div className="flex h-full w-12 shrink-0 flex-col items-center bg-background py-2">
          {/* User panel button (top, standalone) */}
          <button
            type="button"
            className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            title="用户面板"
          >
            <UserCircle className="h-[18px] w-[18px]" />
          </button>

          <div className="mb-1 h-px w-6 bg-border/50" />

          {/* Upper zone — core feature panels */}
          <div className="space-y-1">
            {UPPER_PANELS.map(({ panel, icon, label }) =>
              renderActivityButton(panel, icon, label)
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Lower zone — tools & settings */}
          <div className="space-y-1">
            {LOWER_PANELS.map(({ panel, icon, label }) =>
              renderActivityButton(panel, icon, label)
            )}

            {/* 使用手册 (external link) */}
            <a
              href="https://docs.1037solo.com/#/docs/studysolo-intro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              title="使用手册"
            >
              <BookOpenText className="h-[18px] w-[18px]" />
            </a>

            <Link
              href="/settings"
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                settingsActive
                  ? 'bg-white/8 text-foreground'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}
              title="设置"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>

            <button
              onClick={() => void logoutAndRedirect()}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              title="退出登录"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>

        {/* ─── Panel Content (collapsible, resizable) ─── */}
        {!isCollapsed && (
          <>
            <div
              className="hidden flex-col border-l border-border bg-background lg:flex"
              style={{ width: leftPanelWidth }}
            >
              {/* Panel header */}
              <div className="shrink-0 border-b border-border px-3 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {getPanelLabel(activeSidebarPanel!)}
                </span>
              </div>

              {/* Panel body */}
              {activeSidebarPanel === 'workflows' && (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <nav className="scrollbar-hide flex-1 overflow-y-auto py-2">
                    {workflows.length === 0 ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground">暂无工作流</p>
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
                </div>
              )}

              {activeSidebarPanel === 'ai-chat' && <SidebarAIPanel />}
              {activeSidebarPanel === 'node-store' && <NodeStorePanel />}
              {activeSidebarPanel === 'workflow-examples' && <WorkflowExamplesPanel />}
              {activeSidebarPanel === 'dashboard' && <DashboardPanel />}
              {activeSidebarPanel === 'wallet' && <WalletPanel />}
              {activeSidebarPanel === 'plugins' && <PluginsPanel />}
            </div>

            {/* Resizable handle */}
            <ResizableHandle
              side="left"
              currentWidth={leftPanelWidth}
              onWidthChange={setLeftPanelWidth}
              minWidth={LEFT_PANEL_MIN}
              maxWidth={LEFT_PANEL_MAX}
            />
          </>
        )}
      </div>

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
