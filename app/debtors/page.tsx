'use client';

import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { DebtorsPage } from '@/components/debtors-page';
import { useAuth } from '@/lib/auth-context-supabase';

export default function DebtorsRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <DebtorsPage />
    </>
  );
}
