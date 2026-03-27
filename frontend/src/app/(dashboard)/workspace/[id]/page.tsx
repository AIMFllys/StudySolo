import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

// Reserved route segments that should not be treated as workflow IDs
const RESERVED_SEGMENTS = ['new', 'create', 'edit', 'settings'];

/**
 * Legacy route — 301 redirect handled by next.config.ts,
 * but as a safety net, this page also redirects to /c/[id].
 * 
 * Guard against reserved segments (e.g., /workspace/new) to prevent
 * them from being treated as workflow IDs.
 */
export default async function LegacyWorkflowPage({ params }: Props) {
  const { id } = await params;

  // Guard: prevent reserved segments from being treated as workflow IDs
  if (RESERVED_SEGMENTS.includes(id.toLowerCase())) {
    redirect('/workspace');
  }

  redirect(`/c/${id}`);
}
