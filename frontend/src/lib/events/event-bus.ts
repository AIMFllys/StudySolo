import type { NodeConfigAnchorRect } from '@/features/workflow/components/node-config/popover-position';

export interface EventMap {
  'canvas:tool-change': { tool: 'select' | 'edit' | 'pan' | 'search' };
  'canvas:show-modal': { title: string; message: string };
  'canvas:focus-node': { nodeId: string };
  'canvas:add-annotation': { emoji: string };
  'canvas:delete-annotation': { nodeId: string };
  'canvas:placement-mode': { mode: string };
  'workflow:open-node-config': {
    nodeId: string;
    anchorRect?: NodeConfigAnchorRect | null;
  };
  'workflow:close-node-config': undefined;
  'workflow:toggle-all-slips': { expanded: boolean };
}

type EventHandler<T> = (payload: T) => void;

export class TypedEventBus<Events extends object> {
  private listeners = new Map<keyof Events & string, Set<(payload: unknown) => void>>();

  on<K extends keyof Events & string>(event: K, handler: EventHandler<Events[K]>): () => void {
    const listeners = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    listeners.add(handler as (payload: unknown) => void);
    this.listeners.set(event, listeners);

    return () => {
      const current = this.listeners.get(event);
      if (!current) {
        return;
      }
      current.delete(handler as (payload: unknown) => void);
      if (current.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) {
      return;
    }

    for (const listener of listeners) {
      (listener as EventHandler<Events[K]>)(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }

  listenerCount<K extends keyof Events & string>(event: K): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

export function createEventBus<Events extends object>() {
  return new TypedEventBus<Events>();
}

export const eventBus = createEventBus<EventMap>();

export function normalizeToggleAllSlipsDetail(
  detail: boolean | { expanded?: boolean } | null | undefined,
): boolean | null {
  if (typeof detail === 'boolean') {
    return detail;
  }
  if (typeof detail?.expanded === 'boolean') {
    return detail.expanded;
  }
  return null;
}
