'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import SubMenu from './SubMenu';

/**
 * One shape for every navigation entry, desktop and mobile alike. An entry with
 * `items` is a group: on desktop it becomes a disclosure panel, on mobile a
 * labelled block. `href` is always a real destination, so a group heading is
 * never a dead end.
 */
export interface NavItem {
  title: string;
  href: string;
  items?: NavItem[];
}

/**
 * The primary navigation. Ink band, so the quiet tone is `paper-muted` (8.81:1)
 * resolving to `paper` on hover, with the zari thread drawn underneath on hover
 * AND focus-visible — the keyboard gets exactly what the mouse gets.
 *
 * Hidden below `lg`, where <MobileMenu /> carries the same items.
 */
export default function Menu({ items }: { items: NavItem[] }) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Main" className="hidden lg:block">
      <ul className="flex items-center gap-7">
        {items.map((item) => (
          <li key={item.title}>
            {item.items?.length ? (
              <NavDisclosure item={item} />
            ) : (
              <Link
                href={item.href}
                className="thread-link-ink eyebrow text-paper-muted hover:text-paper"
              >
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * A top-level entry that owns a panel. It is a disclosure, not an ARIA menu:
 * the panel holds ordinary links, so promising `role="menu"` would promise
 * arrow-key semantics that plain links do not have. `aria-expanded` plus
 * `aria-controls` describes it honestly.
 *
 * Dismissal has three routes, all required: Escape (which also returns focus to
 * the trigger), a pointer press outside, and Tab moving focus out of the group.
 */
function NavDisclosure({ item }: { item: NavItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };

    const handlePointerDown = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) close();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, close]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        // Tabbing past the last link in the panel closes it, so a keyboard user
        // never drags an invisible open panel along behind them.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="thread-link-ink eyebrow inline-flex items-center gap-1.5 text-paper-muted hover:text-paper"
      >
        {item.title}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={clsx(
            'h-3 w-3 transition-transform ease-cloth',
            isOpen ? 'rotate-180' : 'rotate-0'
          )}
        >
          <path d="m2.5 4.5 3.5 3.5 3.5-3.5" />
        </svg>
      </button>

      <SubMenu
        id={panelId}
        items={item.items ?? []}
        isHidden={!isOpen}
        onNavigate={() => close()}
      />
    </div>
  );
}
