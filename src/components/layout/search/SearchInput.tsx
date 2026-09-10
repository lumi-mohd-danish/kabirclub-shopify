'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

export default function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback((value: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      router.push(`/search?${params.toString()}`);
    }, 300);
  }, [searchParams, router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <div className="relative">
      {/*
        `.field` is the paper form recipe: 16px type (below that iOS zooms the
        page on focus), `rounded-control`, an `ink-faint` hairline that clears
        WCAG 1.4.11's 3:1 for a control boundary, and a `zari-700` focus
        border. It deliberately leaves `outline` alone so the shared
        focus-visible ring in globals.css still lands. `pr-12` keeps the type
        clear of the magnifier.

        The placeholder was the only label this control had; an `aria-label`
        gives it a real accessible name that survives typing.
      */}
      <input
        type="search"
        value={query}
        onChange={handleChange}
        aria-label="Search products"
        placeholder="Search products..."
        className="field pr-12"
      />
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-zari-700">
        <svg
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
      </div>
    </div>
  );
} 