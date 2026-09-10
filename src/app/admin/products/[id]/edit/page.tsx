'use client';

import ImageUpload from '@/components/admin/ImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { updateProduct } from '@/lib/supabase/admin-api';
import { getProductById } from '@/lib/supabase/api';
import { Product } from '@/lib/supabase/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface EditProductPageProps {
  params: {
    id: string;
  };
}

const CATEGORIES = ['Topwear', 'Bottomwear', 'Accessories', 'Footwear'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// See src/app/admin/products/page.tsx for the shared admin control vocabulary.
// The one filled gold element here is the "Update Product" submit.
const BTN_GOLD =
  'btn px-4 py-3 text-body-sm disabled:border-transparent disabled:bg-ink-600 disabled:text-paper disabled:cursor-not-allowed';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px';
const LABEL = 'eyebrow mb-2 block text-paper-muted';
const HINT = 'mt-2 text-caption text-paper-muted';

// madder is 2.53:1 as text on ink, so an inline error is carried as a filled
// pill (paper on madder, 6.61:1) rather than as coloured type.
const INLINE_ERROR =
  'mt-2 inline-block rounded-control bg-madder px-2 py-1 text-caption text-paper';

const SIZE_CHIP =
  'rounded-control border px-3 py-2 text-body-sm font-medium transition-colors duration-fast ease-cloth';
const SIZE_CHIP_ON = 'border-zari-500 bg-ink-700 text-paper';
const SIZE_CHIP_OFF = 'border-ink-faint text-paper-muted hover:border-paper-muted hover:text-paper';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

export default function EditProductPage({ params }: EditProductPageProps) {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    handle: '',
    sizes: [] as string[],
    images: [] as string[],
    is_active: true
  });

  const [uploadError, setUploadError] = useState<string | null>(null);

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

        const loadedPrice = Number(found.price);

        setProduct(found);
        setFormData({
          title: found.title ?? '',
          description: found.description ?? '',
          price: Number.isFinite(loadedPrice) ? String(loadedPrice) : '',
          category: found.category ?? '',
          handle: found.handle ?? '',
          sizes: Array.isArray(found.sizes) ? found.sizes : [],
          images: Array.isArray(found.images) ? found.images : [],
          is_active: found.is_active !== false
        });
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Tidy the handle once the field is left, rather than fighting the keystrokes.
  const handleHandleBlur = () => {
    setFormData((prev) => ({ ...prev, handle: slugify(prev.handle) }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url]
    }));
    setUploadError(null);
  };

  const handleImageError = (error: string) => {
    setUploadError(error);
  };

  const removeImage = (index: number) => {
    const imageNumber = index + 1;
    if (!window.confirm(`Remove image ${imageNumber} from this product?`)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving || isRedirecting) return;

    try {
      requireAdmin();
      setIsSaving(true);
      setMessage(null);

      const title = formData.title.trim();
      const category = formData.category.trim();
      const handle = slugify(formData.handle);
      const description = formData.description.trim();

      if (!title || !formData.price.trim() || !category || !handle) {
        throw new Error('Please fill in all required fields');
      }

      if (!HANDLE_PATTERN.test(handle)) {
        throw new Error('Handle must contain only lowercase letters, numbers and hyphens');
      }

      const price = Number.parseFloat(formData.price);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      if (formData.sizes.length === 0) {
        throw new Error('Please select at least one available size');
      }

      // Turning a live product off hides it from every shopper — confirm first.
      if (product?.is_active && !formData.is_active) {
        const confirmed = window.confirm(
          `Disable "${title}"?\n\nIt will stop appearing anywhere on the storefront.`
        );
        if (!confirmed) {
          return;
        }
      }

      // Keep the tidied handle visible so the saved value and the field agree.
      setFormData((prev) => ({ ...prev, handle }));

      await updateProduct(params.id, {
        title,
        description,
        price: Math.round(price * 100) / 100,
        category,
        handle,
        sizes: formData.sizes,
        images: formData.images,
        is_active: formData.is_active
      });

      setIsRedirecting(true);
      setMessage({ type: 'success', text: 'Product updated successfully!' });

      redirectTimer.current = setTimeout(() => {
        router.push('/admin/products');
      }, 1200);
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to update product') });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-h3 text-paper-muted">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="bg-madder px-4 py-3 text-body-sm text-paper">
          {loadError ?? 'Product not found'}
        </div>
        <Link href="/admin/products" className={BTN_GHOST}>
          Back to Products
        </Link>
      </div>
    );
  }

  const isBusy = isSaving || isRedirecting;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zari-500">Products</p>
          <h1 className="mt-2 font-display text-h2 text-paper">Edit Product</h1>
          <div className="rule-zari mt-3 w-12" />
          <p className="mt-3 text-body-sm text-paper-muted">Update product information</p>
        </div>
        <Link href="/admin/products" className={BTN_GHOST}>
          Back to Products
        </Link>
      </div>

      {!product.is_active && (
        <div className="bg-haldi px-4 py-3 text-body-sm text-ink">
          This product is disabled and hidden from the storefront. Tick “Product is active” below
          and save to put it back on sale.
        </div>
      )}

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

      <form
        onSubmit={handleSubmit}
        className="space-y-5 border border-ink-700 bg-ink-800 p-4 md:p-6"
      >
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="title" className={LABEL}>
              Product Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="field-ink py-2"
              placeholder="Enter product title"
            />
          </div>

          <div>
            <label htmlFor="category" className={LABEL}>
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="field-ink py-2"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
              {formData.category && !CATEGORIES.includes(formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="price" className={LABEL}>
              Price (₹) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="field-ink num py-2"
              placeholder="0.00"
            />
          </div>

          <div>
            <span className={LABEL}>Available Sizes *</span>
            <div className="grid grid-cols-5 gap-2">
              {SIZES.map((size) => {
                const selected = formData.sizes.includes(size);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    aria-pressed={selected}
                    className={`${SIZE_CHIP} ${selected ? SIZE_CHIP_ON : SIZE_CHIP_OFF}`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <p className={HINT}>Select all available sizes for this product</p>
            {formData.sizes.length > 0 ? (
              <p className="mt-1 text-caption text-paper">Selected: {formData.sizes.join(', ')}</p>
            ) : (
              <p className={INLINE_ERROR}>At least one size is required</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className={LABEL}>
            Handle (URL) *
          </label>
          <input
            type="text"
            id="handle"
            name="handle"
            value={formData.handle}
            onChange={handleInputChange}
            onBlur={handleHandleBlur}
            required
            className="field-ink py-2"
            placeholder="product-url-handle"
          />
          <p className={HINT}>
            URL-friendly identifier — lowercase letters, numbers and hyphens only. Changing it
            breaks any existing link to /product/{product.handle}.
          </p>
        </div>

        <div>
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="field-ink py-2"
            placeholder="Enter product description"
          />
        </div>

        {/* Product Status */}
        <div className="border border-ink-700 bg-ink-900 p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 flex-shrink-0 accent-neem"
            />
            <label htmlFor="is_active" className="text-body-sm font-medium text-paper">
              Product is active (visible to customers)
            </label>
          </div>
          <p className={HINT}>Uncheck to disable this product from being visible to customers</p>
        </div>

        {/* Product Images */}
        <div>
          <span className={LABEL}>Product Images</span>

          {uploadError && (
            <div className="mb-4 bg-madder px-4 py-3 text-body-sm text-paper">{uploadError}</div>
          )}

          <ImageUpload
            onImageUploaded={handleImageUploaded}
            onError={handleImageError}
            maxImages={5}
            currentImages={formData.images}
          />

          {/* Current Images with Remove Option */}
          {formData.images.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2 text-paper-muted">Current Images</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {formData.images.map((imageUrl, index) => (
                  <div key={`${index}-${imageUrl}`} className="group relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="h-24 w-full border border-ink-700 bg-paper-sunk object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -right-2 -top-2 rounded-pill border border-ink-faint bg-ink-900 p-1 text-paper opacity-0 transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder focus:opacity-100 group-hover:opacity-100"
                      title={`Remove image ${index + 1}`}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap gap-3 border-t border-ink-700 pt-5">
          <button type="submit" disabled={isBusy} className={BTN_GOLD}>
            {isRedirecting ? 'Saved' : isSaving ? 'Updating...' : 'Update Product'}
          </button>

          <Link href="/admin/products" className={BTN_GHOST}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
