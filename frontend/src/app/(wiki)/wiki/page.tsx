import Link from 'next/link';

export const metadata = { title: '文档中心 — StudySolo' };

const DOCS = [
  {
    section: '快速开始',
    items: [
      { label: '快速开始', href: '/wiki/getting-started/quick-start', desc: '5 分钟上手 StudySolo' },
    ],
  },
  {
    section: '使用指南',
    items: [
      { label: '创建工作流', href: '/wiki/guides/creating-workflows', desc: '了解工作流的基本操作' },
    ],
  },
];

export default function WikiIndexPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">文档中心</h1>
      <p className="mb-8 text-muted-foreground">StudySolo 使用文档与开发指南</p>

      <div className="flex flex-col gap-8">
        {DOCS.map((group) => (
          <section key={group.section}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {group.section}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex flex-col rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
