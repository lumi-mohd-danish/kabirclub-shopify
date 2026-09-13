'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { NavItem } from './Menu';
import Search from './search';

/**
 * The small-screen half of the primary navigation: a disclosure that drops a
 * full-width panel below the header carrying the search field and every nav
 * destination the desktop bar shows.
 *
 * It closes on Escape (returning focus to the toggle), on a pointer press
 * outside it, on any link inside it, and whenever the route changes.
 * `usePathname()` is used for that last one rather than `useSearchParams()`,
 * which would opt every statically rendered page out of prerendering — this
 * component sits in the root layout, so it renders on all of them.
 */
export default function MobileMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // A completed navigation always leaves the menu closed.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };

    // The viewport growing past `lg` swaps this menu for the desktop bar, so a
    // panel left open would be orphaned off-screen.
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleBreakpoint = () => {
      if (mediaQuery.matches) setIsOpen(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    mediaQuery.addEventListener('change', handleBreakpoint);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
      mediaQuery.removeEventListener('change', handleBreakpoint);
    };
  }, [isOpen, close]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex h-10 w-10 items-center justify-center text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper lg:hidden"
      >
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={isOpen ? 'M6 18 18 6M6 6l12 12' : 'M4 7h16M4 12h16M4 17h16'} />
        </svg>
        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
      </button>

      <div
        id={panelId}
        ref={panelRef}
        hidden={!isOpen}
        className="absolute left-0 right-0 top-full z-30 border-b border-ink-700 bg-ink-900 lg:hidden"
      >
        <div className="container-page space-y-6 py-6">
          <Search onSubmitted={() => close(true)} />

          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {items.map((item) =>
                item.items?.length ? (
                  <li key={item.title} className="pt-2">
                    <p className="eyebrow px-1 pb-2 text-zari-500">{item.title}</p>
                    <ul className="space-y-1">
                      {item.items.map((child) => (
                        <li key={child.href}>
                          <MobileLink href={child.href} onNavigate={() => close()}>
                            {child.title}
                          </MobileLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.title}>
                    <MobileLink href={item.href} onNavigate={() => close()}>
                      {item.title}
                    </MobileLink>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

/** 16px is the mobile floor, and the row is a 44px touch target. */
function MobileLink({
  href,
  onNavigate,
  children
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block px-1 py-3 text-body text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper"
    >
      {children}
    </Link>
  );
}
