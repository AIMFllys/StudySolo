import { notFound } from 'next/navigation';
import path from 'path';
import fs from 'fs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Props {
  params: Promise<{ slug: string[] }>;
}

/**
 * 从 docs/wiki-content/ 读取对应 Markdown 文件并渲染。
 * 路由：/wiki/getting-started/quick-start
 * 文件：docs/wiki-content/getting-started/quick-start.md
 */
function resolveDocPath(slug: string[]): string {
  const relativePath = slug.join('/') + '.md';
  // 从项目根目录（frontend 的上一级）读取
  return path.join(process.cwd(), '..', 'docs', 'wiki-content', relativePath);
}

function readDocContent(slug: string[]): string | null {
  const filePath = resolveDocPath(slug);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export default async function WikiDocPage({ params }: Props) {
  const { slug } = await params;
  const content = readDocContent(slug);

  if (!content) {
    notFound();
  }

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </article>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const title = slug[slug.length - 1]
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase()) ?? '文档';
  return { title: `${title} — StudySolo Wiki` };
}
