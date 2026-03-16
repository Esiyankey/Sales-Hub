"use client";

import { AuthPage } from "@/components/auth-page";
import { DashboardPage } from "@/components/dashboard-page";
import { useAuth } from "@/lib/auth-context-supabase";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <div className="min-h-screen">
      <DashboardPage />
    </div>
  );
}
