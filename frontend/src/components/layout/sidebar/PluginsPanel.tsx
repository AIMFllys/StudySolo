'use client';

import { Puzzle, Download, Check, ExternalLink } from 'lucide-react';

/** 模拟数据 — 后端 API 就绪后替换 */
const MOCK_PLUGINS = [
  {
    id: 'plugin-1',
    name: 'Notion 同步',
    description: '将工作流结果自动同步到 Notion 数据库',
    installed: true,
    version: '1.2.0',
    author: 'StudySolo',
  },
  {
    id: 'plugin-2',
    name: 'Anki 导出器',
    description: '闪卡节点自动导出为 Anki 卡组',
    installed: false,
    version: '0.9.1',
    author: '社区',
  },
  {
    id: 'plugin-3',
    name: 'PDF 解析器',
    description: '上传 PDF 文件并自动解析内容为知识节点',
    installed: false,
    version: '1.0.3',
    author: 'StudySolo',
  },
  {
    id: 'plugin-4',
    name: 'Zotero 连接器',
    description: '从 Zotero 导入文献，自动生成阅读笔记',
    installed: true,
    version: '0.8.0',
    author: '社区',
  },
];

export default function PluginsPanel() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-hide flex-1 overflow-y-auto px-2 py-2">
        <p className="mb-3 px-1 text-[10px] text-muted-foreground">
          安装插件扩展工作流能力
        </p>
        <div className="space-y-2">
          {MOCK_PLUGINS.map((plugin) => (
            <div
              key={plugin.id}
              className="rounded-xl border border-border/50 bg-black/5 p-3 transition-all hover:border-primary/20 dark:bg-white/3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Puzzle className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{plugin.name}</p>
                    <p className="text-[10px] text-muted-foreground/60">v{plugin.version} · {plugin.author}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
                    plugin.installed
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {plugin.installed ? (
                    <>
                      <Check className="h-2.5 w-2.5" />
                      已安装
                    </>
                  ) : (
                    <>
                      <Download className="h-2.5 w-2.5" />
                      安装
                    </>
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{plugin.description}</p>
            </div>
          ))}
        </div>
        <a
          href="#"
          className="mt-3 flex items-center justify-center gap-1 py-2 text-[10px] text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          浏览更多插件
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
