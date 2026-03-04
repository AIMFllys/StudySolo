'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/features/auth/forms';

function LoginPageContent() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020617]" />}>
      <LoginPageContent />
    </Suspense>
  );
}
