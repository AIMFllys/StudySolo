'use client';

import { useState, useEffect, useRef } from 'react';
import { getUserAiModelCatalog } from '@/services/ai-catalog.service';
import { FALLBACK_AI_MODEL_OPTIONS, type AIModelOption } from '../constants/ai-models';

let _cachedModels: AIModelOption[] | null = null;

/**
 * Fetches the user-facing AI model catalog from `/api/ai/models/catalog` once
 * per page session, caches the result in module scope, and filters to models
 * that are enabled and user-selectable.
 *
 * Falls back to FALLBACK_AI_MODEL_OPTIONS if the API is unavailable.
 */
export function useWorkflowCatalog() {
  const [models, setModels] = useState<AIModelOption[]>(_cachedModels ?? FALLBACK_AI_MODEL_OPTIONS);
  const [isLoading, setIsLoading] = useState(_cachedModels === null);
  const didFetch = useRef(_cachedModels !== null);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    let cancelled = false;
    setIsLoading(true);

    getUserAiModelCatalog()
      .then((all) => {
        if (cancelled) return;
        const selectable = all.filter((m) => m.isEnabled && m.isUserSelectable);
        const result = selectable.length > 0 ? selectable : FALLBACK_AI_MODEL_OPTIONS;
        _cachedModels = result;
        setModels(result);
      })
      .catch(() => {
        if (!cancelled) {
          setModels(FALLBACK_AI_MODEL_OPTIONS);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { models, isLoading };
}
