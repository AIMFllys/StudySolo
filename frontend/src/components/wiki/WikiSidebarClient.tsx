'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { STUDYSOLO_WIKI_PLATFORM_LINKS } from '@/lib/studysolo-external-docs';
import type { NavItem } from '@/lib/wiki';

interface WikiSidebarClientProps {
  navItems: NavItem[];
}

const SECTION_EMOJIS: Record<string, string> = {
  快速开始: '🚀',
  使用指南: '🧭',
  节点文档: '🧩',
  'API 参考': '🔌',
};

const DOC_EMOJIS: Record<string, string> = {
  'getting-started/quick-start': '⚡',
  'getting-started/concepts': '🧠',
  'guides/creating-workflows': '🛠️',
  'guides/using-nodes': '🧩',
  'guides/ai-chat': '💬',
};

function currentSlug(pathname: string): string | undefined {
  const prefix = '/wiki/';
  return pathname.startsWith(prefix) ? decodeURIComponent(pathname.slice(prefix.length)) : undefined;
}

function NavTree({ items, activeSlug }: { items: NavItem[]; activeSlug?: string }) {
  return (
    <ul className="wiki-nav-tree">
      {items.map((item, index) => (
        <li key={item.slug ?? `${item.title}-${index}`}>
          {item.slug ? (
            <Link
              href={`/wiki/${item.slug}`}
              className={`wiki-nav-link ${activeSlug === item.slug ? 'wiki-nav-link-active' : ''}`}
            >
              <span aria-hidden="true">{DOC_EMOJIS[item.slug] ?? '📄'}</span>
              <span>{item.title}</span>
            </Link>
          ) : (
            <div className="wiki-nav-group">
              <p className="wiki-nav-group-title">{item.title}</p>
              {item.children && <NavTree items={item.children} activeSlug={activeSlug} />}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function WikiSidebarClient({ navItems }: WikiSidebarClientProps) {
  const activeSlug = currentSlug(usePathname());

  return (
    <nav className="wiki-nav" aria-label="文档导航">
      {navItems.map((section, index) => (
        <div key={section.slug ?? `${section.title}-${index}`} className="wiki-nav-section">
          <p className="wiki-nav-section-title">
            {SECTION_EMOJIS[section.title] ?? '📚'} {section.title}
          </p>
          {section.children && <NavTree items={section.children} activeSlug={activeSlug} />}
        </div>
      ))}

      <div className="wiki-nav-section wiki-nav-section-external">
        <p className="wiki-nav-section-title">📋 平台说明</p>
        <ul className="wiki-external-list">
          {STUDYSOLO_WIKI_PLATFORM_LINKS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="wiki-external-link"
                aria-label={`${item.label}（在新标签页打开）`}
              >
                <span className="wiki-external-link-label">{item.label}</span>
                <ExternalLink className="wiki-external-link-icon h-3.5 w-3.5 shrink-0" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
