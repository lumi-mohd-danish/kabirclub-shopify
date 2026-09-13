'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ProductForm, { type ProductFormValues } from '@/components/admin/ProductForm';
import {
  BTN_GHOST,
  bannerClass,
  errorMessage,
  type AdminMessage
} from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createProduct } from '@/lib/supabase/admin-api';

/** Long enough to read "Product created", short enough not to feel stuck. */
const REDIRECT_DELAY_MS = 1200;

export default function NewProductPage() {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A pending redirect must not fire after this page has gone away.
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  const handleSubmit = async (values: ProductFormValues) => {
    try {
      requireAdmin();
      setIsSaving(true);
      setMessage(null);

      await createProduct(values);

      setIsRedirecting(true);
      setMessage({ type: 'success', text: `“${values.title}” was created.` });

      redirectTimer.current = setTimeout(() => {
        router.push('/admin/products');
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to create product') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Products"
        title="Add new product"
        description="Create a single product for the catalogue."
        actions={
          <Link href="/admin/products" className={BTN_GHOST}>
            Back to products
          </Link>
        }
      />

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      {/* The same form the edit page renders — see ProductForm for why these
          two pages no longer keep their own copy. */}
      <ProductForm
        mode="create"
        submitLabel="Create product"
        busyLabel="Creating…"
        doneLabel="Created"
        isSubmitting={isSaving}
        isDone={isRedirecting}
        onSubmit={handleSubmit}
        cancelHref="/admin/products"
      />
    </div>
  );
}
