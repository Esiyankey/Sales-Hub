'use client';

import { useAuth } from '@/lib/auth-context';
import { AuthPage } from '@/components/auth-page';
import { AppNav } from '@/components/app-nav';
import { ProductsPage } from '@/components/products-page';

export default function ProductsRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <AuthPage />;

  return (
    <>
      <AppNav />
      <ProductsPage />
    </>
  );
}
