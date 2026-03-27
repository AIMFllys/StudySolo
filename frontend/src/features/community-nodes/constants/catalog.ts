import {
  Bot,
  BookOpen,
  BrainCircuit,
  FileSearch,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  ListChecks,
  PenTool,
  ScrollText,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

import type { CommunityNodeCategory } from '@/types';

export const COMMUNITY_NODE_CATEGORIES: Array<{
  id: CommunityNodeCategory;
  label: string;
}> = [
  { id: 'academic', label: '学术论文' },
  { id: 'analysis', label: '分析处理' },
  { id: 'generation', label: '内容生成' },
  { id: 'assessment', label: '测验评估' },
  { id: 'productivity', label: '效率工具' },
  { id: 'other', label: '其他' },
];

export const COMMUNITY_NODE_ICON_MAP: Record<string, LucideIcon> = {
  Bot,
  BookOpen,
  BrainCircuit,
  FileSearch,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  ListChecks,
  PenTool,
  ScrollText,
  Sparkles,
};

export const COMMUNITY_NODE_ICON_OPTIONS = Object.keys(COMMUNITY_NODE_ICON_MAP);

export function getCommunityIcon(iconName?: string): LucideIcon {
  if (!iconName) {
    return Bot;
  }
  return COMMUNITY_NODE_ICON_MAP[iconName] ?? Bot;
}

export function getCommunityCategoryLabel(category: string) {
  return COMMUNITY_NODE_CATEGORIES.find((item) => item.id === category)?.label ?? category;
}
