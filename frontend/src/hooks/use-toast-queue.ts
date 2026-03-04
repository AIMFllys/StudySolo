import { useCallback, useMemo, useState } from 'react';

export type ToastKind = 'success' | 'error';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastQueueResult {
  toasts: ToastItem[];
  pushToast: (kind: ToastKind, message: string, ttlMs?: number) => number;
  dismissToast: (id: number) => void;
  clearToasts: () => void;
}

export function useToastQueue(): ToastQueueResult {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (kind: ToastKind, message: string, ttlMs = 4000) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setToasts((current) => [...current, { id, kind, message }]);
      setTimeout(() => {
        dismissToast(id);
      }, ttlMs);
      return id;
    },
    [dismissToast]
  );

  return useMemo(
    () => ({ toasts, pushToast, dismissToast, clearToasts: () => setToasts([]) }),
    [dismissToast, pushToast, toasts]
  );
}
