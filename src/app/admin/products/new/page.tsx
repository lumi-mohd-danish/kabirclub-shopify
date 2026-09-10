'use client';

import ImageUpload from '@/components/admin/ImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createProduct } from '@/lib/supabase/admin-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// See src/app/admin/products/page.tsx for the shared admin control vocabulary.
// The one filled gold element here is the "Create Product" submit.
const BTN_GOLD =
  'btn px-4 py-3 text-body-sm disabled:border-transparent disabled:bg-ink-600 disabled:text-paper disabled:cursor-not-allowed';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px';
const LABEL = 'eyebrow mb-2 block text-paper-muted';
const HINT = 'mt-2 text-caption text-paper-muted';

// A size chip is a 1px hairline on both states — the selected one takes the
// gold edge and a lifted well rather than a gold fill, because gold fill is
// reserved for the single primary action on the screen.
const SIZE_CHIP =
  'rounded-control border px-3 py-2 text-body-sm font-medium transition-colors duration-fast ease-cloth';
const SIZE_CHIP_ON = 'border-zari-500 bg-ink-700 text-paper';
const SIZE_CHIP_OFF = 'border-ink-faint text-paper-muted hover:border-paper-muted hover:text-paper';

export default function NewProductPage() {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const categories = ['Topwear', 'Bottomwear', 'Accessories', 'Footwear'];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'title') {
      // Auto-generate handle from title with random number
      const randomNumber = Math.floor(Math.random() * 90000) + 10000; // 5-digit random number
      const autoHandle =
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim() +
        '-' +
        randomNumber;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
        handle: autoHandle
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
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

    try {
      requireAdmin();
      setIsLoading(true);
      setMessage(null);

      // Validation
      if (
        !formData.title ||
        !formData.price ||
        !formData.category ||
        !formData.handle ||
        formData.sizes.length === 0
      ) {
        throw new Error('Please fill in all required fields and select at least one size');
      }

      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // Use uploaded images
      const images = formData.images;

      const productData = {
        title: formData.title,
        description: formData.description,
        price: price,
        category: formData.category,
        handle: formData.handle,
        sizes: formData.sizes,
        images: images,
        is_active: formData.is_active
      };

      await createProduct(productData);

      setMessage({
        type: 'success',
        text: 'Product created successfully!'
      });

      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (error: any) {
      console.error('Error creating product:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create product'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zari-500">Products</p>
          <h1 className="mt-2 font-display text-h2 text-paper">Add New Product</h1>
          <div className="rule-zari mt-3 w-12" />
          <p className="mt-3 text-body-sm text-paper-muted">
            Create a new product for your catalog
          </p>
        </div>
        <Link href="/admin/products" className={BTN_GHOST}>
          Back to Products
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
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
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
              {sizes.map((size) => {
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
            {formData.sizes.length > 0 && (
              <p className="mt-1 text-caption text-paper">Selected: {formData.sizes.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Handle field is auto-generated and hidden from user */}

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
          <p className={HINT}>
            Uncheck to create this product as disabled (not visible to customers)
          </p>
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
              <p className="eyebrow mb-2 text-paper-muted">Uploaded Images</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {formData.images.map((imageUrl, index) => (
                  <div key={index} className="group relative">
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
                      title="Remove image"
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
          <button type="submit" disabled={isLoading} className={BTN_GOLD}>
            {isLoading ? 'Creating...' : 'Create Product'}
          </button>

          <Link href="/admin/products" className={BTN_GHOST}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
