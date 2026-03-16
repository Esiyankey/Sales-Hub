'use client';

import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { SalesPage } from '@/components/sales-page';
import { useAuth } from '@/lib/auth-context-supabase';

export default function SalesRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <SalesPage />
    </>
  );
}
