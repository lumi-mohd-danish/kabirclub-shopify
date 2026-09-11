'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { ChevronDownIcon } from '@heroicons/react/24/outline';
import type { ListItem } from '.';
import { FilterItem } from './item';

/**
 * The mobile sort control. It is a disclosure, not an ARIA menu: the panel
 * holds ordinary links, so `aria-expanded` + `aria-controls` on a real
 * `<button>` describes it honestly — and, being a button, it is reachable by
 * keyboard and matches the shared focus-visible rule, which a bare `<div>`
 * never did.
 *
 * Dismissal has three routes: Escape (which returns focus to the trigger), a
 * press outside, and choosing an entry in the panel.
 */
export default function FilterItemDropdown({ list }: { list: ListItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState('');
  const [openSelect, setOpenSelect] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpenSelect(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpenSelect(false);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!openSelect) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openSelect, close]);

  useEffect(() => {
    list.forEach((listItem: ListItem) => {
      if (
        ('path' in listItem && pathname === listItem.path) ||
        ('slug' in listItem && searchParams.get('sort') === listItem.slug)
      ) {
        setActive(listItem.title);
      }
    });
  }, [pathname, list, searchParams]);

  return (
    <div
      className="relative"
      ref={ref}
      onBlur={(event) => {
        // Tabbing past the last entry closes the panel, so a keyboard user
        // never drags an invisible open panel along behind them.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={openSelect}
        aria-controls={panelId}
        onClick={() => {
          setOpenSelect((open) => !open);
        }}
        className="flex w-full items-center justify-between rounded-control border border-ink-faint px-4 py-2 text-body-sm text-ink"
      >
        <span>{active}</span>
        <ChevronDownIcon aria-hidden="true" className="h-4" />
      </button>
      {/* The panel stays in the DOM and is hidden with the `hidden` attribute
          so `aria-controls` always resolves; `display: none` keeps the links
          out of the tab order. Nothing here sets a display utility. */}
      <div
        id={panelId}
        hidden={!openSelect}
        onClick={() => {
          setOpenSelect(false);
        }}
        className="absolute z-40 w-full rounded-control border border-line bg-paper-raised p-4 shadow-overlay"
      >
        <ul>
          {list.map((item: ListItem, i) => (
            <FilterItem key={i} item={item} />
          ))}
        </ul>
      </div>
    </div>
  );
}
