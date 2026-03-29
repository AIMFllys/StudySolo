'use client';

import { Undo, Redo } from 'lucide-react';
import { useWorkflowStore } from '@/stores/use-workflow-store';

export function HistoryControls() {
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const pastLength = useWorkflowStore((s) => s.past.length);
  const futureLength = useWorkflowStore((s) => s.future.length);

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-background/50 backdrop-blur-md rounded-xl border border-border/50 shadow-sm text-muted-foreground">
      <button
        onClick={undo}
        disabled={pastLength === 0}
        className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="撤销 Undo (Ctrl+Z)"
      >
        <Undo strokeWidth={2} size={16} />
      </button>
      <button
        onClick={redo}
        disabled={futureLength === 0}
        className="p-1.5 rounded-lg hover:bg-muted hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="重做 Redo (Ctrl+Y)"
      >
        <Redo strokeWidth={2} size={16} />
      </button>
    </div>
  );
}
