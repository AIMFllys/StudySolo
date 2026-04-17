'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { usePanelStore } from '@/stores/ui/use-panel-store';
import { useIsMobile } from '@/hooks/mobile';
import SettingsPanel from '@/components/layout/sidebar/SettingsPanel';
import KnowledgeBasePanel from '@/components/layout/sidebar/KnowledgeBasePanel';

/**
 * /settings route:
 * - Desktop: redirects to /workspace and opens sidebar settings panel
 * - Mobile: renders settings/knowledge fullscreen with back navigation
 */
export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setActiveSidebarPanel = usePanelStore((s) => s.setActiveSidebarPanel);
  const isMobile = useIsMobile();
  const tab = searchParams.get('tab');

  // Desktop: redirect to workspace and open sidebar panel
  useEffect(() => {
    if (!isMobile) {
      if (tab === 'knowledge') {
        setActiveSidebarPanel('knowledge-base');
      } else {
        setActiveSidebarPanel('settings');
      }
      router.replace('/workspace');
    }
  }, [router, setActiveSidebarPanel, isMobile, tab]);

  // Desktop: show redirect message
  if (!isMobile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">正在跳转到设置面板...</p>
      </div>
    );
  }

  // Mobile: render fullscreen panel
  const isKnowledge = tab === 'knowledge';
  const title = isKnowledge ? '知识库' : '设置';

  return (
    <div className="flex h-full flex-col bg-background pb-16">
      {/* Mobile header with back button */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3">
        <Link
          href="/workspace"
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted transition-colors"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {isKnowledge ? <KnowledgeBasePanel /> : <SettingsPanel />}
      </div>
    </div>
  );
}
