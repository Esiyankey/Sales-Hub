'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { ProfitPage } from '@/components/profit-page';

export default function ProfitRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <ProfitPage />
    </>
  );
}
