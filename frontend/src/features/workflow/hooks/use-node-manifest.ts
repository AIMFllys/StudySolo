'use client';

import { useEffect, useMemo, useState } from 'react';
import type { NodeManifestItem } from '@/types';
import { getNodeManifest, peekNodeManifestCache } from '@/services/node-manifest.service';

export function findNodeManifestItem(
  manifest: NodeManifestItem[],
  nodeType: string,
): NodeManifestItem | null {
  return manifest.find((item) => item.type === nodeType) ?? null;
}

export function useNodeManifest() {
  const cachedManifest = peekNodeManifestCache();
  const [manifest, setManifest] = useState<NodeManifestItem[]>(() => cachedManifest ?? []);
  const [isLoading, setIsLoading] = useState(() => cachedManifest === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const items = await getNodeManifest();
        if (!cancelled) {
          setManifest(items);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '加载节点能力清单失败');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, isLoading, error };
}

export function useNodeManifestItem(nodeType: string) {
  const { manifest, isLoading, error } = useNodeManifest();
  const manifestItem = useMemo(() => findNodeManifestItem(manifest, nodeType), [manifest, nodeType]);

  return { manifestItem, isLoading, error };
}
