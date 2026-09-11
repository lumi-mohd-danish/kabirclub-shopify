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
import { updateProduct } from '@/lib/supabase/admin-api';
import { getProductById } from '@/lib/supabase/api';
import { Product } from '@/lib/supabase/types';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

const REDIRECT_DELAY_MS = 1200;

export default function EditProductPage({ params }: EditProductPageProps) {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // `getProductById` includes inactive products by default, so a disabled
        // product can still be opened here and switched back on.
        const found = await getProductById(params.id);

        if (cancelled) return;

        if (!found) {
          setProduct(null);
          setLoadError('This product no longer exists, or the link is wrong.');
          return;
        }

        setProduct(found);
      } catch (error) {
        if (cancelled) return;

        setProduct(null);
        setLoadError(errorMessage(error, 'Failed to load this product. Please try again.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

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

      await updateProduct(params.id, values);

      setIsRedirecting(true);
      setMessage({ type: 'success', text: `“${values.title}” was saved.` });

      redirectTimer.current = setTimeout(() => {
        router.push('/admin/products');
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to update product') });
    } finally {
      setIsSaving(false);
    }
  };

  const backLink = (
    <Link href="/admin/products" className={BTN_GHOST}>
      Back to products
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p role="status" className="text-body-sm text-paper-muted">
          Loading product…
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-5">
        <AdminPageHeader eyebrow="Products" title="Product not found" actions={backLink} />
        <p role="status" className={bannerClass('error')}>
          {loadError ?? 'Product not found'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Products"
        title="Edit product"
        description={product.title}
        actions={backLink}
      />

      {!product.is_active ? (
        <p className="banner banner-warning">
          This product is disabled and hidden from the storefront. Tick “Product is active” below
          and save to put it back on sale.
        </p>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      {/* The same form the create page renders. `wasActive` is what lets the
          form confirm before a live product is taken off the storefront. */}
      <ProductForm
        // The form seeds its own state once, at mount, so a different product
        // has to be a different form instance.
        key={product.id}
        mode="edit"
        initialValues={{
          title: product.title,
          description: product.description,
          price: product.price,
          category: product.category,
          handle: product.handle,
          sizes: Array.isArray(product.sizes) ? product.sizes : [],
          images: Array.isArray(product.images) ? product.images : [],
          is_active: product.is_active !== false
        }}
        wasActive={product.is_active !== false}
        submitLabel="Save changes"
        busyLabel="Saving…"
        doneLabel="Saved"
        isSubmitting={isSaving}
        isDone={isRedirecting}
        onSubmit={handleSubmit}
        cancelHref="/admin/products"
      />
    </div>
  );
}
