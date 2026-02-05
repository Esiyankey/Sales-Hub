'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { ReportsPage } from '@/components/reports-page';

export default function ReportsRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <ReportsPage />
    </>
  );
}
