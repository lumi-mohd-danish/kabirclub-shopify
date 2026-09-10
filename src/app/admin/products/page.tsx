'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { deleteProduct, toggleProductStatus } from '@/lib/supabase/admin-api';
import { getProducts } from '@/lib/supabase/api';
import { Product } from '@/lib/supabase/types';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const CATEGORIES = ['Topwear', 'Bottomwear', 'Accessories', 'Footwear'];

// -- Admin control vocabulary -------------------------------------------------
// The one filled gold element on this screen is "Add New Product". Everything
// else is a hairline ghost on ink. `madder` cannot be used as TEXT on ink
// (2.53:1 on ink-900), so destructive controls stay neutral at rest and fill
// madder on hover/focus, where paper on madder is 6.61:1.
const BTN_GOLD = 'btn px-4 py-3 text-body-sm';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
const BTN_GHOST_SM =
  'inline-flex items-center justify-center rounded-control border border-ink-faint px-3 py-1.5 text-caption font-medium text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
const CHIP_ACTION =
  'rounded-control border border-ink-faint px-2 py-1 text-caption font-medium text-paper transition-colors duration-fast ease-cloth active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
const TH = 'eyebrow px-4 py-3 text-left text-paper-muted';

const priceFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
});

const formatPrice = (price: number): string =>
  priceFormatter.format(Number.isFinite(price) ? price : 0);

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

export default function AdminProductsPage() {
  const { requireAdmin } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [reloadToken, setReloadToken] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

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
          // Admin must see disabled products — they are the only place a
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

  const handleDeleteProduct = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Delete "${title}" permanently?\n\nThis cannot be undone. To hide it from the storefront instead, use Disable.`
      )
    ) {
      return;
    }

    try {
      requireAdmin();
      setPendingId(id);
      setMessage(null);

      await deleteProduct(id);

      setProducts((current) => current.filter((p) => p.id !== id));
      setTotal((current) => Math.max(0, current - 1));
      setMessage({ type: 'success', text: `Product "${title}" deleted successfully` });

      // Pull the next row into the gap this delete left in the page.
      refresh();
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to delete product') });
    } finally {
      setPendingId(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean, title: string) => {
    const newStatus = !currentStatus;

    // Disabling removes the product from the storefront, so it is confirmed.
    // Re-enabling only restores it, so it is not.
    if (
      !newStatus &&
      !window.confirm(`Disable "${title}"?\n\nIt will stop appearing anywhere on the storefront.`)
    ) {
      return;
    }

    try {
      requireAdmin();
      setPendingId(id);
      setMessage(null);

      await toggleProductStatus(id, newStatus);

      setProducts((current) =>
        current.map((p) => (p.id === id ? { ...p, is_active: newStatus } : p))
      );
      setMessage({
        type: 'success',
        text: `Product "${title}" ${newStatus ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to toggle product status') });
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zari-500">Catalogue</p>
          <h1 className="mt-2 font-display text-h2 text-paper">Products</h1>
          <div className="rule-zari mt-3 w-12" />
          <p className="mt-3 text-body-sm text-paper-muted">Manage your product catalog</p>
        </div>
        <Link href="/admin/products/new" className={BTN_GOLD}>
          Add New Product
        </Link>
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-3 text-body-sm ${
            message.type === 'success' ? 'bg-neem text-paper' : 'bg-madder text-paper'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="border border-ink-700 bg-ink-800 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="field-ink py-2"
            />
          </div>
          <div>
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="field-ink py-2 md:w-56"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-caption text-paper-muted">
          This list includes disabled products so they can be edited or switched back on.
          {disabledCount > 0 &&
            ` ${disabledCount} on this page ${disabledCount === 1 ? 'is' : 'are'} hidden from the storefront.`}
        </p>
      </div>

      {/* Products Table */}
      <div className="border border-ink-700 bg-ink-800">
        {isLoading && products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-body text-paper-muted">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-body text-paper-muted">
              {hasFilters ? 'No products match these filters' : 'No products found'}
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className={`mt-4 ${BTN_GHOST}`}
              >
                Clear Filters
              </button>
            ) : (
              <Link href="/admin/products/new" className={`mt-4 ${BTN_GHOST}`}>
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div
            className={`overflow-x-auto transition-opacity duration-fast ease-cloth ${isLoading ? 'opacity-60' : ''}`}
          >
            <table className="w-full">
              <thead className="border-b border-ink-700 bg-ink-900">
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
                    <tr
                      key={product.id}
                      className={`transition-colors duration-fast ease-cloth hover:bg-ink-700 ${
                        product.is_active ? '' : 'bg-ink-900'
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className={`h-10 w-10 flex-shrink-0 bg-paper-sunk object-cover ${
                                product.is_active ? '' : 'opacity-50'
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = '/images/placeholder.png';
                              }}
                            />
                          )}
                          <div>
                            <div
                              className={`text-body-sm font-medium ${product.is_active ? 'text-paper' : 'text-paper-muted'}`}
                            >
                              {product.title}
                            </div>
                            <div className="text-caption text-paper-muted">{product.handle}</div>
                            {!product.is_active && (
                              <div className="mt-1 text-caption text-paper-muted">
                                Hidden from the storefront
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-block rounded-control border border-ink-700 bg-ink-900 px-2 py-0.5 text-caption text-paper-muted">
                          {product.category}
                        </span>
                      </td>
                      <td className="num whitespace-nowrap px-4 py-3 text-body-sm text-paper">
                        {formatPrice(product.price)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`eyebrow inline-block rounded-control px-2 py-1 ${
                              product.is_active ? 'bg-neem text-paper' : 'bg-madder text-paper'
                            }`}
                          >
                            {product.is_active ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(product.id, product.is_active, product.title)
                            }
                            disabled={isPending}
                            className={`${CHIP_ACTION} ${
                              product.is_active
                                ? 'hover:border-madder hover:bg-madder'
                                : 'hover:border-neem hover:bg-neem'
                            }`}
                            title={product.is_active ? 'Disable product' : 'Enable product'}
                          >
                            {product.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                      <td className="num whitespace-nowrap px-4 py-3 text-caption text-paper-muted">
                        {new Date(product.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-body-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="thread-link-ink text-zari-500"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.title)}
                            disabled={isPending}
                            className={`${CHIP_ACTION} hover:border-madder hover:bg-madder`}
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
                            <span
                              className="cursor-not-allowed text-ink-faint"
                              title="Enable this product to open it on the storefront"
                            >
                              View
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-col gap-3 border-t border-ink-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="num text-caption text-paper-muted">
              Showing {firstRowNumber}–{lastRowNumber} of {total} product{total === 1 ? '' : 's'}
            </p>
            {pageCount > 1 && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
