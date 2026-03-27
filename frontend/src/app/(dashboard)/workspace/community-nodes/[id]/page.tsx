import { CommunityNodeManagePage } from '@/features/community-nodes/components/CommunityNodeManagePage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CommunityNodeManageRoute({ params }: Props) {
  const { id } = await params;
  return <CommunityNodeManagePage nodeId={id} />;
}
