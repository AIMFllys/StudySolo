'use client';

import { Suspense } from 'react';
import { AdminAuditPageView } from '@/features/admin/audit/AdminAuditPageView';

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminAuditPageView />
    </Suspense>
  );
}
