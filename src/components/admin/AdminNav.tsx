'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

/**
 * The admin bar.
 *
 * Two things were missing. The nav had no active state at all — four links
 * that looked identical on every screen, so the only way to know where you
 * were was to read the heading — and there was no way to sign out of admin
 * anywhere in the app, which matters far more here than on the storefront: an
 * admin session left open on a shared machine is a catalogue anyone can edit.
 *
 * Active state is driven by `usePathname`, and it is announced as well as
 * drawn: `aria-current="page"` for assistive tech, a `zari-500` thread and
 * full-strength `paper` type for everyone else. `/admin` matches exactly, the
 * section links match their whole subtree, so /admin/products/new keeps
 * "Products" lit.
 *
 * The idle links keep `.thread-link-ink`, which draws the same gold thread on
 * hover and focus-visible alike; the active one draws its thread permanently
 * and so does not take that class, which is what stops two rules stacking.
 */
interface NavItem {
  href: string;
  label: string;
  /** `/admin` must not light up for every page beneath it. */
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/catalog-upload', label: 'Catalog Upload' }
];

const NAV_LINK = 'eyebrow block whitespace-nowrap py-2';
const NAV_LINK_IDLE = 'thread-link-ink text-paper-muted hover:text-paper';
const NAV_LINK_ACTIVE = 'text-paper';

const BAR_LINK =
  'thread-link-ink eyebrow whitespace-nowrap py-2 text-paper-muted hover:text-paper disabled:cursor-not-allowed disabled:opacity-50';

function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export default function AdminNav() {
  const { user, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
      // `logout()` clears the session cookie the middleware reads, so /admin is
      // already closed by the time this lands.
      router.replace('/login?redirect=/admin');
    } catch (error) {
      console.error('Admin sign out failed:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <nav aria-label="Admin" className="border-b border-ink-700 bg-ink-900">
      <div className="container-page flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-8">
          <Link href="/" className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-display text-h3 text-paper">KabirClub</span>
            <span className="eyebrow text-zari-500">Admin</span>
          </Link>

          <ul className="flex flex-wrap items-center gap-x-6 gap-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(NAV_LINK, active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE)}
                  >
                    {item.label}
                    {active ? <span className="rule-zari mt-1 block" aria-hidden="true" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          {user?.name ? (
            <span className="eyebrow whitespace-nowrap text-paper-muted">
              Signed in as {user.name}
            </span>
          ) : null}
          <Link href="/" className={BAR_LINK}>
            Back to Store
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className={BAR_LINK}
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </nav>
  );
}
