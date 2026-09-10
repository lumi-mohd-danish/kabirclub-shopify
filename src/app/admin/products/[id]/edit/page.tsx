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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Tidy the handle once the field is left, rather than fighting the keystrokes.
  const handleHandleBlur = () => {
    setFormData(prev => ({ ...prev, handle: slugify(prev.handle) }));
  };

  const handleImageUploaded = (url: string) => {
    setFormData(prev => ({
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

    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter(s => s !== size)
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
      setFormData(prev => ({ ...prev, handle }));

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
        <div className="text-white text-xl">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900 text-red-200 p-4 rounded-lg">
          {loadError ?? 'Product not found'}
        </div>
        <Link
          href="/admin/products"
          className="inline-block px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const isBusy = isSaving || isRedirecting;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Product</h1>
          <p className="text-gray-400">Update product information</p>
        </div>
        <Link
          href="/admin/products"
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Back to Products
        </Link>
      </div>

      {!product.is_active && (
        <div className="bg-yellow-900 text-yellow-100 p-4 rounded-lg">
          This product is disabled and hidden from the storefront. Tick “Product is active” below
          and save to put it back on sale.
        </div>
      )}

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

      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-6 space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-white text-sm font-medium mb-2">
              Product Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="Enter product title"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-white text-sm font-medium mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Category</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
              {formData.category && !CATEGORIES.includes(formData.category) && (
                <option value={formData.category}>{formData.category}</option>
              )}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-white text-sm font-medium mb-2">
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
              className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <div>
            <span className="block text-white text-sm font-medium mb-2">
              Available Sizes *
            </span>
            <div className="grid grid-cols-5 gap-2">
              {SIZES.map(size => {
                const selected = formData.sizes.includes(size);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    aria-pressed={selected}
                    className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      selected
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            <p className="text-gray-400 text-xs mt-1">
              Select all available sizes for this product
            </p>
            {formData.sizes.length > 0 ? (
              <p className="text-blue-400 text-xs mt-1">
                Selected: {formData.sizes.join(', ')}
              </p>
            ) : (
              <p className="text-red-300 text-xs mt-1">
                At least one size is required
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="handle" className="block text-white text-sm font-medium mb-2">
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
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="product-url-handle"
          />
          <p className="text-gray-400 text-xs mt-1">
            URL-friendly identifier — lowercase letters, numbers and hyphens only. Changing it
            breaks any existing link to /product/{product.handle}.
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-white text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="Enter product description"
          />
        </div>

        {/* Product Status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="is_active" className="text-white text-sm font-medium">
              Product is active (visible to customers)
            </label>
          </div>
          <p className="text-gray-400 text-xs mt-1">
            Uncheck to disable this product from being visible to customers
          </p>
        </div>

        {/* Product Images */}
        <div>
          <span className="block text-white text-sm font-medium mb-2">
            Product Images
          </span>

          {uploadError && (
            <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-lg">
              {uploadError}
            </div>
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
              <p className="text-gray-400 text-sm mb-2">Current Images:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {formData.images.map((imageUrl, index) => (
                  <div key={`${index}-${imageUrl}`} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.png';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      title={`Remove image ${index + 1}`}
                      aria-label={`Remove image ${index + 1}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isBusy}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-medium"
          >
            {isRedirecting ? 'Saved' : isSaving ? 'Updating...' : 'Update Product'}
          </button>

          <Link
            href="/admin/products"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
