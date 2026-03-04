'use client';

import { useCreateWorkflowAction } from '@/hooks/use-create-workflow-action';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { creating, createWorkflow } = useCreateWorkflowAction();

  return (
    <>
      <Navbar onNewWorkflow={createWorkflow} creating={creating} />
      {children}
      <MobileNav onNewWorkflow={createWorkflow} creating={creating} />
    </>
  );
}
