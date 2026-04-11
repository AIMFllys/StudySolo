import type { Node } from '@xyflow/react';
import type { NodeManifestItem } from '@/types';
import { getNodeTypeMeta, NODE_TYPE_META } from '@/features/workflow/constants/workflow-meta';

type ManifestLookup = Record<string, NodeManifestItem | undefined>;

interface ResolveExecutionNodeCopyOptions {
  nodeType: string;
  traceNodeName?: string | null;
  nodeLabel?: string | null;
  manifestItem?: Pick<NodeManifestItem, 'display_name' | 'description'> | null;
}

function normalizeCopy(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function resolveExecutionNodeCopy({
  nodeType,
  traceNodeName,
  nodeLabel,
  manifestItem,
}: ResolveExecutionNodeCopyOptions) {
  const meta = getNodeTypeMeta(nodeType);

  return {
    title:
      normalizeCopy(traceNodeName) ??
      normalizeCopy(nodeLabel) ??
      normalizeCopy(manifestItem?.display_name) ??
      meta.label,
    description: normalizeCopy(manifestItem?.description) ?? meta.description,
  };
}

export function buildExecutionNodeNameMap(
  nodes: Node[],
  manifestByType: ManifestLookup,
) {
  return Object.fromEntries(
    nodes.map((node) => {
      const nodeType = String((node.data as { type?: string } | undefined)?.type ?? node.type ?? '');
      const nodeLabel = (node.data as { label?: string } | undefined)?.label;
      const manifestItem = manifestByType[nodeType] ?? null;
      const meta = NODE_TYPE_META[nodeType as keyof typeof NODE_TYPE_META];

      const title =
        normalizeCopy(nodeLabel) ??
        normalizeCopy(manifestItem?.display_name) ??
        normalizeCopy(meta?.label) ??
        node.id;

      return [node.id, title];
    }),
  );
}
