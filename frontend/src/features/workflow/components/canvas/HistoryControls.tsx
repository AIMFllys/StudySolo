'use client';

import { Undo, Redo } from 'lucide-react';
import { useWorkflowStore } from '@/stores/workflow/use-workflow-store';

export function HistoryControls() {
  const undo = useWorkflowStore((s) => s.undo);
  const redo = useWorkflowStore((s) => s.redo);
  const pastLength = useWorkflowStore((s) => s.past.length);
  const futureLength = useWorkflowStore((s) => s.future.length);

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm text-slate-500 dark:text-slate-400">
      <button
        onClick={undo}
        disabled={pastLength === 0}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="撤销 Undo (Ctrl+Z)"
      >
        <Undo strokeWidth={2} size={16} />
      </button>
      <button
        onClick={redo}
        disabled={futureLength === 0}
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        title="重做 Redo (Ctrl+Y)"
      >
        <Redo strokeWidth={2} size={16} />
      </button>
    </div>
  );
}
