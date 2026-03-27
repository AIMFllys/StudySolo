'use client';

import { useEffect, useState } from 'react';
import type { NodeManifestItem } from '@/types';
import { getNodeManifest } from '@/services/node-manifest.service';

export function useNodeManifest() {
  const [manifest, setManifest] = useState<NodeManifestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
