import Link from 'next/link';
import { formatDate } from '@/utils/date';
import { fetchWorkflowListForServer } from '@/services/workflow.server.service';

function statusLabel(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: '草稿', className: 'bg-muted text-muted-foreground' },
    running: {
      label: '运行中',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      label: '已完成',
      className:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    error: {
      label: '错误',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  return map[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  };
}

export default async function WorkspacePage() {
  const workflows = await fetchWorkflowListForServer();

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-semibold">我的工作流</h1>

      {workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <svg
            className="mb-4 opacity-30"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
          >
            <rect
              x="4"
              y="4"
              width="40"
              height="40"
              rx="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M14 18h20M14 24h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm">还没有工作流</p>
          <p className="mt-1 text-xs">点击右上角新建工作流开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((workflow) => {
            const { label, className } = statusLabel(workflow.status);
            return (
              <Link
                key={workflow.id}
                href={`/workspace/${workflow.id}`}
                className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-sm font-medium leading-snug transition-colors group-hover:text-primary">
                    {workflow.name}
                  </h2>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
                  >
                    {label}
                  </span>
                </div>

                {workflow.description ? (
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {workflow.description}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-3 text-xs text-muted-foreground">
                  <span>更新于 {formatDate(workflow.updated_at, 'zh-CN')}</span>
                  <span>创建于 {formatDate(workflow.created_at, 'zh-CN')}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

