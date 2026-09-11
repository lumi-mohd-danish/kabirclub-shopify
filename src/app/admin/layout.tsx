'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import AdminNav from '@/components/admin/AdminNav';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * Admin chrome: one ink band, like the storefront header and footer, but at
 * tool density.
 *
 * The redirects below are presentation, not access control — `src/middleware.ts`
 * verifies the session and the `role` column server-side before any /admin
 * route renders, and this page cannot be reached without passing it. What
 * happens here is only that an admin whose session expires while the tab is
 * open is sent to sign in again instead of sitting in front of an empty shell.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated()) {
      router.replace('/login?redirect=/admin');
      return;
    }

    if (!isAdmin()) {
      router.replace('/');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5">
        <p role="status" className="text-h3 text-paper-muted">
          Loading…
        </p>
      </div>
    );
  }

  if (!isAuthenticated() || !isAdmin()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900 px-5">
        <p role="status" className="text-center text-h3 text-paper">
          Access denied
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper">
      <AdminNav />
      <main className="container-page py-6">{children}</main>
    </div>
  );
}
