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

  const refresh = () => setReloadToken(token => token + 1);

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

      setProducts(current => current.filter(p => p.id !== id));
      setTotal(current => Math.max(0, current - 1));
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

      setProducts(current => current.map(p => (p.id === id ? { ...p, is_active: newStatus } : p)));
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
  const disabledCount = products.filter(product => !product.is_active).length;
  const hasFilters = Boolean(debouncedQuery || selectedCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-gray-400">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add New Product
        </Link>
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-900 rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="search"
              aria-label="Search products"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-gray-400 text-xs mt-4">
          This list includes disabled products so they can be edited or switched back on.
          {disabledCount > 0 && ` ${disabledCount} on this page ${disabledCount === 1 ? 'is' : 'are'} hidden from the storefront.`}
        </p>
      </div>

      {/* Products Table */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {isLoading && products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-white">Loading products...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">
              {hasFilters ? 'No products match these filters' : 'No products found'}
            </div>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="inline-block mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/admin/products/new"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Your First Product
              </Link>
            )}
          </div>
        ) : (
          <div className={`overflow-x-auto transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {products.map((product) => {
                  const isPending = pendingId === product.id;

                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-gray-800 ${product.is_active ? '' : 'bg-gray-800/40'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className={`h-10 w-10 rounded-lg object-cover mr-4 ${
                                product.is_active ? '' : 'opacity-50'
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = '/images/placeholder.png';
                              }}
                            />
                          )}
                          <div>
                            <div className={`text-sm font-medium ${product.is_active ? 'text-white' : 'text-gray-400'}`}>
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-400">
                              {product.handle}
                            </div>
                            {!product.is_active && (
                              <div className="text-xs text-red-300 mt-1">
                                Hidden from the storefront
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-700 text-gray-300 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatPrice(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.is_active
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}>
                            {product.is_active ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product.id, product.is_active, product.title)}
                            disabled={isPending}
                            className={`px-2 py-1 text-xs rounded disabled:opacity-50 disabled:cursor-not-allowed ${
                              product.is_active
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            title={product.is_active ? 'Disable product' : 'Enable product'}
                          >
                            {product.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(product.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.title)}
                            disabled={isPending}
                            className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                          {product.is_active ? (
                            <Link
                              href={`/product/${product.handle}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-300"
                            >
                              View
                            </Link>
                          ) : (
                            <span
                              className="text-gray-600 cursor-not-allowed"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-700 px-6 py-4">
            <p className="text-sm text-gray-400">
              Showing {firstRowNumber}–{lastRowNumber} of {total} product{total === 1 ? '' : 's'}
            </p>
            {pageCount > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(current => Math.max(0, current - 1))}
                  disabled={page === 0 || isLoading}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {page + 1} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(current => Math.min(pageCount - 1, current + 1))}
                  disabled={page >= pageCount - 1 || isLoading}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
