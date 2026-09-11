'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * The catalogue's in-page search field.
 *
 * It is a real `<form role="search">` with a real `<label>` and a real submit
 * button, so it works from the keyboard and from a screen reader the same way
 * the header's search does — the debounce is an enhancement on top, not the
 * only way to run a query.
 *
 * WHAT IT KEEPS AND WHAT IT DROPS. Sort and size are carried over, because they
 * are how the shopper asked to see things. `page` is dropped: results for a new
 * query have their own page 1, and keeping `page=4` was landing people on an
 * empty grid. On a collection route the category is carried as `?category=`, so
 * searching from inside a collection searches THAT collection rather than
 * silently widening to the whole catalogue.
 */

const DEBOUNCE_MS = 300;

export default function SearchInput({
  /** Collection handle to keep as `?category=` when the route owns the category. */
  category
}: {
  category?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const initialQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(initialQuery);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // The URL is the source of truth: a Back navigation, or a cleared search
  // chip, has to be reflected in the field rather than leaving stale text in it.
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const hrefFor = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }

      if (category) {
        params.set('category', category);
      }

      params.delete('page');

      const queryString = params.toString();

      return queryString ? `/search?${queryString}` : '/search';
    },
    [searchParams, category]
  );

  const navigate = useCallback(
    (value: string) => {
      clearTimeout(timeoutRef.current);
      router.push(hrefFor(value));
    },
    [router, hrefFor]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;

      setQuery(value);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => navigate(value.trim()), DEBOUNCE_MS);
    },
    [navigate]
  );

  return (
    <form
      role="search"
      className="relative"
      onSubmit={(event) => {
        event.preventDefault();
        navigate(query.trim());
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>

      {/*
        `.field` is the paper form recipe: 16px type (below that iOS zooms the
        page on focus), `rounded-control`, an `ink-faint` hairline that clears
        WCAG 1.4.11's 3:1 for a control boundary, and a `zari-700` focus
        border. It deliberately leaves `outline` alone so the shared
        focus-visible ring in globals.css still lands. `pr-12` keeps the type
        clear of the submit button.
      */}
      <input
        id={inputId}
        name="q"
        type="search"
        value={query}
        onChange={handleChange}
        autoComplete="off"
        placeholder="Search products..."
        className="field pr-12"
      />

      <button
        type="submit"
        className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-control text-zari-700 transition-colors duration-fast ease-cloth hover:text-ink"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}
