'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

import AdminThumb from './AdminThumb';
import ConfirmDialog, { useConfirm } from './ConfirmDialog';
import ImageUpload from './ImageUpload';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD,
  HINT,
  INLINE_ERROR,
  LABEL,
  PLATE_SUNK,
  PRODUCT_CATEGORIES,
  PRODUCT_SIZES,
  TOGGLE,
  TOGGLE_OFF,
  TOGGLE_ON
} from './admin-ui';

/**
 * The product form — one copy, used by both /admin/products/new and
 * /admin/products/[id]/edit.
 *
 * The two pages were 395 and 530 lines of the same eleven fields, and they had
 * already diverged in ways a merchandiser would feel:
 *   - "new" hid the handle field entirely and generated a fresh random suffix
 *     on EVERY keystroke of the title, so the URL of a product depended on
 *     when you stopped typing;
 *   - "edit" validated the handle against a pattern and tidied it on blur,
 *     "new" did neither, so the create path could write a handle that the edit
 *     path would then refuse to save;
 *   - "edit" confirmed before dropping an image, "new" removed it silently;
 *   - only "edit" told you when the sizes were missing.
 *
 * Everything here is the stricter of the two behaviours. The page above keeps
 * what is genuinely per-page: the API call, the success banner and the
 * redirect.
 */
const MAX_IMAGES = 5;

/** Lowercase words joined by single hyphens. Matches the storefront's routes. */
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ProductFormValues {
  title: string;
  description: string;
  price: number;
  category: string;
  handle: string;
  sizes: string[];
  images: string[];
  is_active: boolean;
}

type FieldKey = 'title' | 'category' | 'price' | 'handle' | 'sizes';

export interface ProductFormProps {
  /** 'create' derives the handle from the title until you edit it yourself. */
  mode: 'create' | 'edit';
  initialValues?: Partial<ProductFormValues>;
  /**
   * Whether the product is live right now (edit only). Turning a live product
   * off hides it from every shopper, so that transition is confirmed.
   */
  wasActive?: boolean;
  /** e.g. 'Create product'. */
  submitLabel: string;
  /** e.g. 'Creating…', shown while `isSubmitting`. */
  busyLabel: string;
  /** e.g. 'Saved', shown while `isDone` — the pause before the redirect. */
  doneLabel?: string;
  isSubmitting?: boolean;
  isDone?: boolean;
  // eslint-disable-next-line no-unused-vars
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  cancelHref: string;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export default function ProductForm({
  mode,
  initialValues,
  wasActive = false,
  submitLabel,
  busyLabel,
  doneLabel,
  isSubmitting = false,
  isDone = false,
  onSubmit,
  cancelHref
}: ProductFormProps) {
  const fieldId = useId();
  const { confirm, dialogProps } = useConfirm();

  const initialPrice = Number(initialValues?.price);

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [price, setPrice] = useState(
    Number.isFinite(initialPrice) && initialPrice > 0 ? String(initialPrice) : ''
  );
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [handle, setHandle] = useState(initialValues?.handle ?? '');
  const [sizes, setSizes] = useState<string[]>(initialValues?.sizes ?? []);
  const [images, setImages] = useState<string[]>(initialValues?.images ?? []);
  const [isActive, setIsActive] = useState(initialValues?.is_active !== false);

  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  /**
   * Once the handle has been typed in, it stops following the title. An
   * existing product's handle is already its own — changing it breaks live
   * links — so edit never auto-derives.
   */
  const [handleEdited, setHandleEdited] = useState(mode === 'edit');

  /**
   * One suffix per form, decided when the form mounts. The old create page
   * rolled a new five-digit number on every keystroke, which meant the final
   * handle depended on when you stopped typing. A fixed suffix still keeps two
   * products with the same name apart.
   */
  const handleSuffixRef = useRef(String(Math.floor(Math.random() * 90000) + 10000));

  const isBusy = isSubmitting || isDone;

  const ids = {
    title: `${fieldId}-title`,
    category: `${fieldId}-category`,
    price: `${fieldId}-price`,
    handle: `${fieldId}-handle`,
    description: `${fieldId}-description`,
    active: `${fieldId}-active`,
    size: (size: string) => `${fieldId}-size-${size}`
  };

  const errorId = (field: FieldKey) => `${fieldId}-${field}-error`;

  const clearError = (field: FieldKey) =>
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    clearError('title');

    if (mode === 'create' && !handleEdited) {
      const slug = slugify(value);
      setHandle(slug ? `${slug}-${handleSuffixRef.current}` : '');
      clearError('handle');
    }
  };

  const toggleSize = (size: string) => {
    setSizes((current) =>
      current.includes(size) ? current.filter((entry) => entry !== size) : [...current, size]
    );
    clearError('sizes');
  };

  const removeImage = async (index: number) => {
    const confirmed = await confirm({
      title: `Remove image ${index + 1}?`,
      body: 'It comes off this product when you save. The file itself is not deleted.',
      confirmLabel: 'Remove image'
    });

    if (!confirmed) return;

    setImages((current) => current.filter((_, position) => position !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isBusy) return;

    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const tidyHandle = slugify(handle);
    const parsedPrice = Number.parseFloat(price);

    const nextErrors: Partial<Record<FieldKey, string>> = {};

    if (!trimmedTitle) nextErrors.title = 'A title is required.';
    if (!trimmedCategory) nextErrors.category = 'Pick a category.';
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = 'Enter a price greater than zero.';
    }
    if (!tidyHandle) {
      nextErrors.handle = 'A handle is required.';
    } else if (!HANDLE_PATTERN.test(tidyHandle)) {
      nextErrors.handle = 'Use lowercase letters, numbers and single hyphens only.';
    }
    if (sizes.length === 0) nextErrors.sizes = 'Select at least one size.';

    // Show the tidied handle whether or not it passed, so the field and the
    // value being validated always agree.
    setHandle(tidyHandle);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      // Send the keyboard to the first problem rather than leaving it wherever
      // the submit button was.
      const order: FieldKey[] = ['title', 'category', 'price', 'handle', 'sizes'];
      const first = order.find((field) => nextErrors[field]);
      if (first) {
        const target = first === 'sizes' ? ids.size(PRODUCT_SIZES[0] ?? 'S') : ids[first];
        document.getElementById(target)?.focus();
      }
      return;
    }

    setErrors({});

    // Turning a live product off hides it from every shopper.
    if (mode === 'edit' && wasActive && !isActive) {
      const confirmed = await confirm({
        title: `Disable “${trimmedTitle}”?`,
        body: 'It stops appearing anywhere on the storefront until you switch it back on. Nothing is deleted.',
        confirmLabel: 'Disable product'
      });

      if (!confirmed) return;
    }

    await onSubmit({
      title: trimmedTitle,
      description: trimmedDescription,
      price: Math.round(parsedPrice * 100) / 100,
      category: trimmedCategory,
      handle: tidyHandle,
      sizes,
      images,
      is_active: isActive
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 border border-ink-700 bg-ink-800 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={ids.title} className={LABEL}>
              Product title *
            </label>
            <input
              id={ids.title}
              name="title"
              type="text"
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              required
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? errorId('title') : undefined}
              className={FIELD}
              placeholder="Enter product title"
            />
            {errors.title ? (
              <p id={errorId('title')} className={INLINE_ERROR}>
                {errors.title}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={ids.category} className={LABEL}>
              Category *
            </label>
            <select
              id={ids.category}
              name="category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                clearError('category');
              }}
              required
              aria-invalid={errors.category ? true : undefined}
              aria-describedby={errors.category ? errorId('category') : undefined}
              className={FIELD}
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
              {/* A product saved under a category that is no longer offered
                  keeps it until someone changes it, instead of silently
                  resetting to blank on the next save. */}
              {category && !PRODUCT_CATEGORIES.includes(category) ? (
                <option value={category}>{category}</option>
              ) : null}
            </select>
            {errors.category ? (
              <p id={errorId('category')} className={INLINE_ERROR}>
                {errors.category}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={ids.price} className={LABEL}>
              Price (₹) *
            </label>
            <input
              id={ids.price}
              name="price"
              type="number"
              inputMode="decimal"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                clearError('price');
              }}
              required
              min="0"
              step="0.01"
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={errors.price ? errorId('price') : undefined}
              className={cn(FIELD, 'num')}
              placeholder="0.00"
            />
            {errors.price ? (
              <p id={errorId('price')} className={INLINE_ERROR}>
                {errors.price}
              </p>
            ) : null}
          </div>

          {/* A real fieldset: the five boxes are one question, and a legend is
              the only way a screen reader hears it as one. Each box is a real
              checkbox with its own id/label pair, so it takes the focus ring
              and reads its own state. */}
          <fieldset
            aria-invalid={errors.sizes ? true : undefined}
            aria-describedby={errors.sizes ? errorId('sizes') : undefined}
          >
            <legend className={LABEL}>Available sizes *</legend>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_SIZES.map((size) => {
                const selected = sizes.includes(size);

                return (
                  <label
                    key={size}
                    htmlFor={ids.size(size)}
                    className={cn(
                      TOGGLE,
                      selected ? TOGGLE_ON : TOGGLE_OFF,
                      'inline-flex cursor-pointer items-center gap-2 px-2.5 py-1.5 text-body-sm font-medium'
                    )}
                  >
                    <input
                      id={ids.size(size)}
                      name="sizes"
                      type="checkbox"
                      value={size}
                      checked={selected}
                      onChange={() => toggleSize(size)}
                      className="h-4 w-4 shrink-0 accent-zari-500"
                    />
                    {size}
                  </label>
                );
              })}
            </div>
            {errors.sizes ? (
              <p id={errorId('sizes')} className={INLINE_ERROR}>
                {errors.sizes}
              </p>
            ) : (
              <p className={HINT}>
                {sizes.length > 0
                  ? `Selected: ${sizes.join(', ')}`
                  : 'Select every size this product is available in.'}
              </p>
            )}
          </fieldset>
        </div>

        <div>
          <label htmlFor={ids.handle} className={LABEL}>
            Handle (URL) *
          </label>
          <input
            id={ids.handle}
            name="handle"
            type="text"
            value={handle}
            onChange={(event) => {
              setHandleEdited(true);
              setHandle(event.target.value);
              clearError('handle');
            }}
            onBlur={() => setHandle((current) => slugify(current))}
            required
            aria-invalid={errors.handle ? true : undefined}
            aria-describedby={errors.handle ? errorId('handle') : undefined}
            className={FIELD}
            placeholder="product-url-handle"
          />
          {errors.handle ? (
            <p id={errorId('handle')} className={INLINE_ERROR}>
              {errors.handle}
            </p>
          ) : (
            <p className={HINT}>
              {mode === 'create'
                ? 'Generated from the title. Lowercase letters, numbers and hyphens only.'
                : 'Lowercase letters, numbers and hyphens only. Changing it breaks every existing link to this product.'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={ids.description} className={LABEL}>
            Description
          </label>
          <textarea
            id={ids.description}
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className={FIELD}
            placeholder="Enter product description"
          />
        </div>

        <div className={cn(PLATE_SUNK, 'p-3')}>
          <div className="flex items-center gap-3">
            <input
              id={ids.active}
              name="is_active"
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              className="h-4 w-4 shrink-0 accent-neem"
            />
            <label htmlFor={ids.active} className="text-body-sm font-medium text-paper">
              Product is active (visible to customers)
            </label>
          </div>
          <p className={HINT}>
            {mode === 'create'
              ? 'Uncheck to create this product hidden from the storefront.'
              : 'Uncheck to hide this product from the storefront without deleting it.'}
          </p>
        </div>

        <fieldset>
          <legend className={LABEL}>Product images</legend>

          {uploadError ? (
            <p role="status" aria-live="polite" className="banner banner-error mb-3">
              {uploadError}
            </p>
          ) : null}

          <ImageUpload
            onImageUploaded={(url) => {
              setImages((current) => [...current, url]);
              setUploadError(null);
            }}
            onError={(message) => setUploadError(message)}
            maxImages={MAX_IMAGES}
            currentImages={images}
          />

          {images.length > 0 ? (
            <div className="mt-4">
              <p className="eyebrow mb-2 text-paper-muted">
                {mode === 'create' ? 'Uploaded images' : 'Current images'}
              </p>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                {images.map((imageUrl, index) => (
                  <li key={`${index}-${imageUrl}`} className="group relative">
                    <AdminThumb
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="h-24 w-full border border-ink-700"
                      sizes="(min-width: 1024px) 160px, 33vw"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove image ${index + 1}`}
                      className="absolute -right-2 -top-2 rounded-pill border border-ink-faint bg-ink-900 p-1 text-paper opacity-0 transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder focus-visible:opacity-100 group-hover:opacity-100"
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
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </fieldset>

        <div className="flex flex-wrap gap-2 border-t border-ink-700 pt-4">
          <button type="submit" disabled={isBusy} className={BTN_PRIMARY}>
            {isDone ? (doneLabel ?? submitLabel) : isSubmitting ? busyLabel : submitLabel}
          </button>
          <Link href={cancelHref} className={BTN_GHOST}>
            Cancel
          </Link>
        </div>
      </form>

      <ConfirmDialog {...dialogProps} />
    </>
  );
}
