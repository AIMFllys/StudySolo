import type { NodeManifestItem } from '@/types';
import { authedFetch, parseApiError } from '@/services/api-client';

let _manifestCache: NodeManifestItem[] | null = null;
let _manifestInflight: Promise<NodeManifestItem[]> | null = null;

export function peekNodeManifestCache(): NodeManifestItem[] | null {
  return _manifestCache;
}

export async function getNodeManifest(force = false): Promise<NodeManifestItem[]> {
  if (!force && _manifestCache) {
    return _manifestCache;
  }

  if (!force && _manifestInflight) {
    return _manifestInflight;
  }

  _manifestInflight = (async () => {
    const response = await authedFetch('/api/nodes/manifest');
    if (!response.ok) {
      throw new Error(await parseApiError(response, '加载节点能力清单失败'));
    }

    const data = (await response.json()) as NodeManifestItem[];
    _manifestCache = data;
    return data;
  })().finally(() => {
    _manifestInflight = null;
  });

  return _manifestInflight;
}

export function invalidateNodeManifestCache() {
  _manifestCache = null;
  _manifestInflight = null;
}
