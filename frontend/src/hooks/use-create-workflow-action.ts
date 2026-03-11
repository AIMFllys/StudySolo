import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface WorkflowCreateResponse {
  id: string;
}

interface UseCreateWorkflowActionResult {
  creating: boolean;
  createWorkflow: () => Promise<void>;
}

function buildAutoWorkflowName() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = now.getFullYear();
  const m = pad(now.getMonth() + 1);
  const d = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `工作流_${y}${m}${d}_${hh}${mm}`;
}

export function useCreateWorkflowAction(defaultName?: string): UseCreateWorkflowActionResult {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const createWorkflow = useCallback(async () => {
    if (creating) {
      return;
    }

    setCreating(true);
    try {
      const workflowName = defaultName?.trim() || buildAutoWorkflowName();
      const response = await fetch('/api/workflow/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workflowName }),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body.detail as string | undefined) ?? '创建失败');
      }

      const data = (await response.json()) as WorkflowCreateResponse;
      router.push(`/workspace/${data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '创建工作流失败';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }, [creating, defaultName, router]);

  return { creating, createWorkflow };
}
