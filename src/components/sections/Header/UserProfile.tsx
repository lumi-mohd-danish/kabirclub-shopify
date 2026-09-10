'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

/**
 * The only auth-dependent element in the header, isolated so the rest of the
 * chrome can be server-rendered. There is deliberately no skeleton pulse here:
 * while the session resolves we show the signed-out control, which is correct
 * for most visitors, reserves exactly the same space as the avatar, and stays
 * keyboard-reachable throughout. A grey block that resolves after two effect
 * ticks was the reason every page shipped a placeholder where its chrome
 * should be.
 */
export default function UserProfile() {
  const { user, logout, isAuthenticated, isLoading, refreshAuth } = useAuth();
  const { isAdmin } = useAdminAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeDropdown = useCallback((returnFocus = false) => {
    setShowDropdown(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Close dropdown when user logs out and handle state changes
  useEffect(() => {
    if (!isAuthenticated()) {
      setShowDropdown(false);
    }
  }, [isAuthenticated, user]);

  // Listen for login events and refresh auth state
  useEffect(() => {
    const handleLoginEvent = () => {
      refreshAuth();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userLogin', handleLoginEvent);

      return () => {
        window.removeEventListener('userLogin', handleLoginEvent);
      };
    }
  }, [refreshAuth]);

  // Escape closes and hands focus back to the trigger; a press outside just
  // closes. The old full-screen click-catcher is gone — it swallowed the first
  // click on everything else on the page.
  useEffect(() => {
    if (!showDropdown) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDropdown(true);
    };

    const handlePointerDown = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) closeDropdown();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [showDropdown, closeDropdown]);

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  if (isLoading || !isAuthenticated()) {
    return (
      <Link
        href="/login"
        className="inline-flex h-10 w-10 items-center justify-center rounded-pill border border-ink-700 text-paper-muted transition-colors duration-fast ease-cloth hover:border-zari-500/35 hover:text-paper"
      >
        <AccountIcon />
        <span className="sr-only">Sign in</span>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={showDropdown}
        aria-controls={menuId}
        onClick={() => setShowDropdown((open) => !open)}
        className="inline-flex items-center gap-2 text-paper-muted transition-colors duration-fast ease-cloth hover:text-paper"
      >
        {/*
          The cart badge is already this view's one filled gold element, so the
          avatar takes the thread treatment instead: an ink well with a zari
          hairline and zari-500 type (8.5:1 on ink-800).
        */}
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-pill border border-zari-500/35 bg-ink-800 text-caption font-medium text-zari-500"
        >
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </span>
        <span className="hidden max-w-[10ch] truncate text-body-sm lg:block">
          {user?.name || 'Account'}
        </span>
        <span className="sr-only">Account menu</span>
      </button>

      <div id={menuId} hidden={!showDropdown} className="absolute right-0 top-full z-30 pt-3">
        <div className="w-56 border border-ink-700 bg-ink-900 shadow-overlay">
          <div className="rule-zari" />

          <div className="border-b border-ink-700 px-4 py-3">
            <p className="truncate text-body-sm font-medium text-paper">{user?.name}</p>
            <p className="truncate text-caption text-paper-muted">{user?.email}</p>
          </div>

          <ul className="py-2">
            <li>
              <AccountMenuLink href="/profile" onNavigate={() => setShowDropdown(false)}>
                <AccountIcon className="h-4 w-4" />
                My profile
              </AccountMenuLink>
            </li>
            <li>
              <AccountMenuLink href="/orders" onNavigate={() => setShowDropdown(false)}>
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
                </svg>
                My orders
              </AccountMenuLink>
            </li>
            {/* Admin Panel Link - Only show for admin users */}
            {isAdmin() && (
              <li>
                <AccountMenuLink href="/admin" onNavigate={() => setShowDropdown(false)}>
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065Z" />
                    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  Admin panel
                </AccountMenuLink>
              </li>
            )}
          </ul>

          {/*
            Log out is neutral, not red: `madder` is 2.5:1 on ink-900 and the
            palette has no destructive tone that survives a dark ground. The
            separator and its position carry the distinction instead.
          */}
          <div className="border-t border-ink-700 py-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm text-paper-muted transition-colors duration-fast ease-cloth hover:bg-ink-800 hover:text-paper"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
              </svg>
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountMenuLink({
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
      className="flex items-center gap-3 px-4 py-2.5 text-body-sm text-paper-muted transition-colors duration-fast ease-cloth hover:bg-ink-800 hover:text-paper"
    >
      {children}
    </Link>
  );
}

function AccountIcon({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z" />
    </svg>
  );
}
