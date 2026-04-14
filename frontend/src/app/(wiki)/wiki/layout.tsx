/**
 * Wiki 专属布局 — 独立于主应用 DashboardShell。
 * 左侧：文档导航；右侧：内容区。
 * 内容由小陈填充，骨架由 Phase 5 第四波创建。
 */

import Link from 'next/link';

const NAV_ITEMS = [
  {
    section: '快速开始',
    items: [{ label: '快速开始', href: '/wiki/getting-started/quick-start' }],
  },
  {
    section: '使用指南',
    items: [{ label: '创建工作流', href: '/wiki/guides/creating-workflows' }],
  },
];

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar nav */}
      <aside className="hidden w-56 shrink-0 border-r border-border md:block">
        <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-6">
          <Link
            href="/wiki"
            className="mb-6 text-base font-semibold text-foreground hover:text-primary"
          >
            📖 文档中心
          </Link>

          <nav className="flex flex-col gap-4">
            {NAV_ITEMS.map((group) => (
              <div key={group.section}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.section}
                </p>
                <ul className="flex flex-col gap-1">
                  {group.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto px-6 py-8 md:px-12">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
