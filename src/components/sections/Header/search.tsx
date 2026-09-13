'use client';

import { createUrl } from '@/lib/utils';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useId } from 'react';

/**
 * The header search form.
 *
 * It deliberately does NOT read `useSearchParams()`. This component is mounted
 * in the root layout on every route, and a `useSearchParams()` call there with
 * no Suspense boundary above it opts every statically rendered page out of
 * prerendering. Submitting a fresh `/search?q=…` is also the honest behaviour
 * for a global entry point: carrying `category` or `page` over from whatever
 * page you happened to be on would silently narrow the results.
 */
export default function Search({ onSubmitted }: { onSubmitted?: () => void }) {
  const router = useRouter();
  const inputId = useId();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const field = event.currentTarget.elements.namedItem('search');
    const value = field instanceof HTMLInputElement ? field.value.trim() : '';
    const params = new URLSearchParams();

    if (value) params.set('q', value);

    router.push(createUrl('/search', params));
    onSubmitted?.();
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full">
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        name="search"
        type="search"
        placeholder="Search for products"
        autoComplete="off"
        className="field-ink pr-12"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-control text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper"
      >
        <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}
