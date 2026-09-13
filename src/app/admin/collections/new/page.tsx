'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD,
  HINT,
  INLINE_ERROR,
  LABEL,
  bannerClass,
  errorMessage,
  type AdminMessage
} from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createCollection } from '@/lib/supabase/admin-api';

const REDIRECT_DELAY_MS = 1200;

/** The same rule the product handle follows, and the same one the routes use. */
const HANDLE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type FieldKey = 'title' | 'handle';

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export default function NewCollectionPage() {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();
  const fieldId = useId();

  const [title, setTitle] = useState('');
  const [handle, setHandle] = useState('');
  const [handleEdited, setHandleEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');

  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ids = {
    title: `${fieldId}-title`,
    handle: `${fieldId}-handle`,
    description: `${fieldId}-description`,
    image: `${fieldId}-image`
  };

  const errorId = (field: FieldKey) => `${fieldId}-${field}-error`;

  // A pending redirect must not fire after this page has gone away.
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

  const isBusy = isSaving || isRedirecting;

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setErrors((current) => ({ ...current, title: undefined }));

    // The handle follows the title until it is typed in by hand. It used to
    // stop following after the very first keystroke, which left every
    // collection handled by its first letter.
    if (!handleEdited) {
      setHandle(slugify(value));
      setErrors((current) => ({ ...current, handle: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isBusy) return;

    const trimmedTitle = title.trim();
    const tidyHandle = slugify(handle);
    const nextErrors: Partial<Record<FieldKey, string>> = {};

    if (!trimmedTitle) nextErrors.title = 'A title is required.';
    if (!tidyHandle) {
      nextErrors.handle = 'A handle is required.';
    } else if (!HANDLE_PATTERN.test(tidyHandle)) {
      nextErrors.handle = 'Use lowercase letters, numbers and single hyphens only.';
    }

    setHandle(tidyHandle);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      document.getElementById(nextErrors.title ? ids.title : ids.handle)?.focus();
      return;
    }

    setErrors({});

    try {
      requireAdmin();
      setIsSaving(true);
      setMessage(null);

      await createCollection({
        title: trimmedTitle,
        description: description.trim(),
        handle: tidyHandle,
        image: image.trim() || undefined
      });

      setIsRedirecting(true);
      setMessage({ type: 'success', text: `“${trimmedTitle}” was created.` });

      redirectTimer.current = setTimeout(() => {
        router.push('/admin/collections');
      }, REDIRECT_DELAY_MS);
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to create collection') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Collections"
        title="Add new collection"
        description="Group products under one handle."
        actions={
          <Link href="/admin/collections" className={BTN_GHOST}>
            Back to collections
          </Link>
        }
      />

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 border border-ink-700 bg-ink-800 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor={ids.title} className={LABEL}>
              Collection title *
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
              placeholder="Enter collection title"
            />
            {errors.title ? (
              <p id={errorId('title')} className={INLINE_ERROR}>
                {errors.title}
              </p>
            ) : null}
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
                setErrors((current) => ({ ...current, handle: undefined }));
              }}
              onBlur={() => setHandle((current) => slugify(current))}
              required
              aria-invalid={errors.handle ? true : undefined}
              aria-describedby={errors.handle ? errorId('handle') : undefined}
              className={FIELD}
              placeholder="collection-url-handle"
            />
            {errors.handle ? (
              <p id={errorId('handle')} className={INLINE_ERROR}>
                {errors.handle}
              </p>
            ) : (
              <p className={HINT}>
                Generated from the title. This becomes /search/{handle || 'your-handle'}.
              </p>
            )}
          </div>
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
            placeholder="Enter collection description"
          />
        </div>

        <div>
          <label htmlFor={ids.image} className={LABEL}>
            Collection image (optional)
          </label>
          <input
            id={ids.image}
            name="image"
            type="url"
            value={image}
            onChange={(event) => setImage(event.target.value)}
            className={FIELD}
            placeholder="https://example.com/collection-image.jpg"
          />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-ink-700 pt-4">
          <button type="submit" disabled={isBusy} className={BTN_PRIMARY}>
            {isRedirecting ? 'Created' : isSaving ? 'Creating…' : 'Create collection'}
          </button>
          <Link href="/admin/collections" className={BTN_GHOST}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
