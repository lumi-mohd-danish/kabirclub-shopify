'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminThumb from '@/components/admin/AdminThumb';
import ConfirmDialog, { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  BTN_GHOST,
  BTN_GHOST_SM,
  BTN_PRIMARY,
  CHIP_ACTIVE,
  CHIP_DANGER,
  CHIP_INACTIVE,
  CHIP_POSITIVE,
  FIELD,
  LABEL,
  PLATE,
  PRODUCT_CATEGORIES,
  TABLE_HEAD,
  TD,
  TD_MUTED,
  TH,
  TR,
  bannerClass,
  errorMessage,
  type AdminMessage
} from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { deleteProduct, toggleProductStatus } from '@/lib/supabase/admin-api';
import { getProducts } from '@/lib/supabase/api';
import { Product } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

const formatPrice = (price: number): string =>
  priceFormatter.format(Number.isFinite(price) ? price : 0);

export default function AdminProductsPage() {
  const { requireAdmin } = useAdminAuth();
  const { confirm, dialogProps } = useConfirm();
  const fieldId = useId();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const searchId = `${fieldId}-search`;
  const categoryId = `${fieldId}-category`;

  // Debounce typing so a search does not fire one query per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Any change to the filters invalidates the current page number.
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, selectedCategory]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const data = await getProducts({
          query: debouncedQuery || undefined,
          category: selectedCategory || undefined,
          page,
          limit: PAGE_SIZE,
          // Admin must see disabled products — this is the only place a
          // disabled product can be edited or switched back on.
          includeInactive: true
        });

        // A response that arrived after the filters moved on is stale.
        if (cancelled) return;

        setProducts(data.products);
        setTotal(data.total);

        // Deleting the last rows of the last page can leave us past the end.
        if (data.products.length === 0 && data.total > 0 && page > 0) {
          setPage(Math.max(0, Math.ceil(data.total / PAGE_SIZE) - 1));
        }
      } catch (error) {
        if (cancelled) return;

        setProducts([]);
        setTotal(0);
        setMessage({ type: 'error', text: errorMessage(error, 'Failed to fetch products') });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, selectedCategory, page, reloadToken]);

  const refresh = () => setReloadToken((token) => token + 1);

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = await confirm({
      title: `Delete “${product.title}”?`,
      body: 'This cannot be undone. To hide it from the storefront instead, use Disable.',
      confirmLabel: 'Delete product'
    });

    if (!confirmed) return;

    try {
      requireAdmin();
      setPendingId(product.id);
      setMessage(null);

      await deleteProduct(product.id);

      setProducts((current) => current.filter((entry) => entry.id !== product.id));
      setTotal((current) => Math.max(0, current - 1));
      setMessage({ type: 'success', text: `“${product.title}” was deleted.` });

      // Pull the next row into the gap this delete left in the page.
      refresh();
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to delete product') });
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = !product.is_active;

    // Disabling removes the product from the storefront, so it is confirmed.
    // Re-enabling only restores it, so it is not.
    if (!nextStatus) {
      const confirmed = await confirm({
        title: `Disable “${product.title}”?`,
        body: 'It stops appearing anywhere on the storefront until you switch it back on. Nothing is deleted.',
        confirmLabel: 'Disable product'
      });

      if (!confirmed) return;
    }

    try {
      requireAdmin();
      setPendingId(product.id);
      setMessage(null);

      await toggleProductStatus(product.id, nextStatus);

      setProducts((current) =>
        current.map((entry) =>
          entry.id === product.id ? { ...entry, is_active: nextStatus } : entry
        )
      );
      setMessage({
        type: 'success',
        text: `“${product.title}” is now ${nextStatus ? 'active' : 'disabled'}.`
      });
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to change product status') });
    } finally {
      setPendingId(null);
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstRowNumber = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastRowNumber = page * PAGE_SIZE + products.length;
  const disabledCount = products.filter((product) => !product.is_active).length;
  const hasFilters = Boolean(debouncedQuery || selectedCategory);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every product, including the ones hidden from the storefront."
        actions={
          <Link href="/admin/products/new" className={BTN_PRIMARY}>
            Add new product
          </Link>
        }
      />

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      {/* Filters */}
      <div className={cn(PLATE, 'p-3')}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor={searchId} className={LABEL}>
              Search
            </label>
            <input
              id={searchId}
              name="search"
              type="search"
              placeholder="Title or description"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={FIELD}
            />
          </div>
          <div className="md:w-56">
            <label htmlFor={categoryId} className={LABEL}>
              Category
            </label>
            <select
              id={categoryId}
              name="category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className={FIELD}
            >
              <option value="">All categories</option>
              {PRODUCT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        {disabledCount > 0 ? (
          <p className="num mt-3 text-caption text-paper-muted">
            {disabledCount} of the products on this page {disabledCount === 1 ? 'is' : 'are'} hidden
            from the storefront.
          </p>
        ) : null}
      </div>

      {/* Products table */}
      <div className={PLATE}>
        {isLoading && products.length === 0 ? (
          <p className="p-6 text-center text-body-sm text-paper-muted">Loading products…</p>
        ) : products.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-body-sm text-paper-muted">
              {hasFilters ? 'No products match these filters.' : 'No products yet.'}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className={cn('mt-3', BTN_GHOST)}
              >
                Clear filters
              </button>
            ) : (
              <Link href="/admin/products/new" className={cn('mt-3', BTN_GHOST)}>
                Add your first product
              </Link>
            )}
          </div>
        ) : (
          <div
            className={cn(
              'overflow-x-auto transition-opacity duration-fast ease-cloth',
              isLoading && 'opacity-60'
            )}
          >
            <table className="w-full">
              <caption className="sr-only">
                Products, including disabled ones, with their category, price and status.
              </caption>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th scope="col" className={TH}>
                    Product
                  </th>
                  <th scope="col" className={TH}>
                    Category
                  </th>
                  <th scope="col" className={TH}>
                    Price
                  </th>
                  <th scope="col" className={TH}>
                    Status
                  </th>
                  <th scope="col" className={TH}>
                    Created
                  </th>
                  <th scope="col" className={TH}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-700">
                {products.map((product) => {
                  const isPending = pendingId === product.id;

                  return (
                    <tr key={product.id} className={cn(TR, !product.is_active && 'bg-ink-900')}>
                      {/* The row header is the product, so the other five
                          cells are announced against its name. */}
                      <th scope="row" className={cn(TD, 'text-left font-medium')}>
                        <span className="flex items-center gap-2">
                          <AdminThumb
                            src={product.images?.[0]}
                            alt=""
                            className="h-8 w-8"
                            sizes="32px"
                            dimmed={!product.is_active}
                          />
                          <span className="min-w-0">
                            <span
                              className={cn(
                                'block truncate leading-tight',
                                product.is_active ? 'text-paper' : 'text-paper-muted'
                              )}
                            >
                              {product.title}
                            </span>
                            <span className="block truncate leading-tight text-paper-muted">
                              {product.handle}
                            </span>
                          </span>
                        </span>
                      </th>
                      <td className={TD_MUTED}>{product.category}</td>
                      <td className={cn(TD, 'num')}>{formatPrice(product.price)}</td>
                      <td className={TD}>
                        <span className="flex items-center gap-2">
                          <span className={product.is_active ? CHIP_ACTIVE : CHIP_INACTIVE}>
                            {product.is_active ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            disabled={isPending}
                            className={product.is_active ? CHIP_DANGER : CHIP_POSITIVE}
                          >
                            {product.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </span>
                      </td>
                      <td className={cn(TD_MUTED, 'num')}>
                        {new Date(product.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className={TD}>
                        <span className="flex items-center gap-3">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="thread-link-ink text-zari-500"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={isPending}
                            className={CHIP_DANGER}
                          >
                            Delete
                          </button>
                          {product.is_active ? (
                            <Link
                              href={`/product/${product.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="thread-link-ink text-paper-muted hover:text-paper"
                            >
                              View
                            </Link>
                          ) : (
                            // A real disabled control, not a greyed-out
                            // <span>: the WCAG exemption for inactive
                            // components only covers actual controls, and
                            // `ink-faint` fell to 3.66:1 once the row took its
                            // `ink-700` hover. `paper-muted` holds 7.14:1 on
                            // that ground.
                            <button
                              type="button"
                              disabled
                              className="cursor-not-allowed text-paper-muted"
                              title="Enable this product to open it on the storefront"
                            >
                              View
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 ? (
          <div className="flex flex-col gap-2 border-t border-ink-700 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="num text-caption text-paper-muted">
              Showing {firstRowNumber}–{lastRowNumber} of {total} product{total === 1 ? '' : 's'}
            </p>
            {pageCount > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page === 0 || isLoading}
                  className={BTN_GHOST_SM}
                >
                  Previous
                </button>
                <span className="num text-caption text-paper-muted">
                  Page {page + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                  disabled={page >= pageCount - 1 || isLoading}
                  className={BTN_GHOST_SM}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
