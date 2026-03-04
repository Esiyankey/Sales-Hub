"use client";

import { AuthPage } from "@/components/auth-page";
import { DashboardPage } from "@/components/dashboard-page";
import { useAuth } from "@/lib/auth-context-supabase";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen">
       <DashboardPage/>
      </div>
    );
  }

  return <AuthPage />;
}
