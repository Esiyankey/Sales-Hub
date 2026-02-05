'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { DashboardPage } from '@/components/dashboard-page';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <svg className="w-8 h-8 text-primary mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-muted-foreground">Loading SalesHub...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <AppNav />
      <DashboardPage />
    </>
  );
}
