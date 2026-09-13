'use client';

import Link from 'next/link';

import type { NavItem } from './Menu';

/**
 * The panel behind a top-level nav group.
 *
 * It stays in the DOM and is hidden with the `hidden` attribute rather than
 * being conditionally rendered: the links are then present in the server HTML
 * for crawlers, and `display: none` still keeps them out of the tab order and
 * off the accessibility tree. Nothing here sets a `display` utility, which is
 * what lets the attribute win.
 *
 * Semantically it is a `<ul>` inside the parent `<nav>`'s `<li>` — a real
 * submenu — not a second `<nav>` landmark.
 */
export default function SubMenu({
  id,
  items,
  isHidden,
  onNavigate
}: {
  id: string;
  items: NavItem[];
  isHidden: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div id={id} hidden={isHidden} className="absolute left-0 top-full z-30 pt-3">
      <div className="w-56 border border-ink-700 bg-ink-900 shadow-overlay">
        {/* The woven thread across the top edge, tying the panel to the band. */}
        <div className="rule-zari" />
        <ul className="py-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="block px-4 py-2.5 text-body-sm text-paper-muted transition-colors duration-fast ease-cloth hover:bg-ink-800 hover:text-paper"
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
