import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DependencyList } from 'react';
import type { AsyncState } from '@/types/async';

interface AdminListQueryResult<T> extends AsyncState<T> {
  refetch: () => Promise<void>;
}

export function useAdminListQuery<T>(
  queryKey: string,
  fetcher: () => Promise<T>,
  deps: DependencyList = []
): AdminListQueryResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      setState({ data: null, loading: false, error: message });
    }
  }, [fetcher]);

  useEffect(() => {
    void run();
    // queryKey forces explicit cache-key style dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, ...deps]);

  return useMemo(
    () => ({
      data: state.data,
      loading: state.loading,
      error: state.error,
      refetch: run,
    }),
    [run, state.data, state.error, state.loading]
  );
}
