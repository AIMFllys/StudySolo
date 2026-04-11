import type { NodeManifestItem } from '@/types';
import { getNodeTypeMeta } from '@/features/workflow/constants/workflow-meta';

interface ResolveNodeConfigCopyOptions {
  nodeLabel?: string | null;
  nodeType: string;
  manifestItem?: Pick<NodeManifestItem, 'display_name' | 'description'> | null;
}

function normalizeCopy(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveNodeConfigCopy({
  nodeLabel,
  nodeType,
  manifestItem,
}: ResolveNodeConfigCopyOptions) {
  const meta = getNodeTypeMeta(nodeType);

  return {
    title: normalizeCopy(nodeLabel) ?? normalizeCopy(manifestItem?.display_name) ?? meta.label,
    description: normalizeCopy(manifestItem?.description) ?? meta.description,
  };
}
