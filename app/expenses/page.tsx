'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { ExpensesPage } from '@/components/expenses-page';

export default function ExpensesRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <ExpensesPage />
    </>
  );
}
