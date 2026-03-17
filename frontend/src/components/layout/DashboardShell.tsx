'use client';

import { useCreateWorkflowAction } from '@/features/workflow/hooks/use-create-workflow-action';
import Navbar from './Navbar';
import NavbarAutoHide from './NavbarAutoHide';
import MobileNav from './MobileNav';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { creating, createWorkflow } = useCreateWorkflowAction();

  return (
    <>
      <NavbarAutoHide>
        <Navbar onNewWorkflow={createWorkflow} creating={creating} />
      </NavbarAutoHide>
      {children}
      <MobileNav onNewWorkflow={createWorkflow} creating={creating} />
    </>
  );
}
