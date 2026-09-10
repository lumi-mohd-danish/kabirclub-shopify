'use client';

import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import Search from './search';

/**
 * Desktop search: a toggle in the bar, and a full-width strip that drops below
 * the header on the same ink ground. Below `lg` the search lives inside
 * <MobileMenu /> instead, so the bar stays down to a logo, cart and account.
 *
 * The panel is hidden with the `hidden` attribute (no `display` utility on that
 * element, so the attribute wins), which keeps the input out of the tab order
 * while it is closed. Escape closes and hands focus back to the toggle;
 * framer-motion's LazyMotion wrapper came off, since a strip that opens and
 * closes does not justify shipping an animation runtime into the header.
 */
export default function SearchIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    panelRef.current?.querySelector('input')?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };

    const handlePointerDown = (event: Event) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen, close]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className="hidden h-10 w-10 items-center justify-center text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper lg:inline-flex"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MagnifyingGlassIcon className="h-6 w-6" aria-hidden="true" />
        )}
        <span className="sr-only">{isOpen ? 'Close search' : 'Search'}</span>
      </button>

      <div
        id={panelId}
        ref={panelRef}
        hidden={!isOpen}
        className="absolute left-0 right-0 top-full z-30 border-b border-ink-700 bg-ink-900"
      >
        <div className="container-page py-4">
          <Search onSubmitted={() => close(true)} />
        </div>
      </div>
    </>
  );
}
