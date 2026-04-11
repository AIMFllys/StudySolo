import type { NodeManifestItem } from '@/types';
import { getNodeTypeMeta } from '@/features/workflow/constants/workflow-meta';

interface ResolveCanvasNodeDescriptionOptions {
  nodeType: string;
  isCommunityNode?: boolean;
  inputHint?: string | null;
  manifestItem?: Pick<NodeManifestItem, 'description'> | null;
}

function normalizeCopy(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveCanvasNodeDescription({
  nodeType,
  isCommunityNode = false,
  inputHint,
  manifestItem,
}: ResolveCanvasNodeDescriptionOptions) {
  if (isCommunityNode) {
    return (
      normalizeCopy(inputHint) ??
      normalizeCopy(manifestItem?.description) ??
      '社区共享的封装 AI 节点'
    );
  }

  return normalizeCopy(manifestItem?.description) ?? getNodeTypeMeta(nodeType).description;
}
