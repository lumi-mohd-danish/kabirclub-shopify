'use client';

import { useAuth } from '@/hooks/useAuth';
import { type CartWithSizes } from '@/lib/supabase/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCartForSession } from './actions';
import CartModal from './modal';

export default function Cart() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [cart, setCart] = useState<CartWithSizes | null>(null);

  // Monotonic ticket for in-flight fetches. Only the newest one may write to
  // state, so a slow response can never overwrite a newer cart.
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const signedIn = isAuthenticated() && Boolean(user);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clearCartState = useCallback(() => {
    // Invalidate anything in flight, so it cannot repopulate the cart.
    requestIdRef.current += 1;
    setCart(null);
  }, []);

  const refreshCart = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      // The session cookie is httpOnly, so the read happens server-side: the
      // action resolves the session AND the cart in one round trip, and the id
      // never reaches the browser to be swapped for somebody else's.
      const nextCart = await getCartForSession();

      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setCart(nextCart);
    } catch (error) {
      console.error('Could not load the cart:', error);
      if (!isMountedRef.current || requestId !== requestIdRef.current) return;
      setCart(null);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) {
      // Nobody is signed in: never leave another account's cart on screen.
      clearCartState();
      return;
    }

    void refreshCart();
  }, [signedIn, refreshCart, clearCartState]);

  useEffect(() => {
    const handleCartUpdated = () => {
      if (signedIn) void refreshCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdated);
    window.addEventListener('userLogin', handleCartUpdated);
    window.addEventListener('userLogout', clearCartState);

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdated);
      window.removeEventListener('userLogin', handleCartUpdated);
      window.removeEventListener('userLogout', clearCartState);
    };
  }, [signedIn, refreshCart, clearCartState]);

  if (isLoading) {
    return <div className="h-6 w-6 animate-pulse rounded bg-ink-800" aria-hidden="true"></div>;
  }

  return (
    <div className="group relative">
      <CartModal cart={cart ?? undefined} />
      {/*
        Tooltip. The header is an ink band, so the tooltip inverts to paper —
        an `ink-800` chip on an `ink-900` ground is 1.08:1 and would be
        invisible. Paper on ink also gives the arrow something to read as.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-control bg-paper px-2 py-1 text-caption text-ink opacity-0 transition-opacity duration-fast ease-cloth group-hover:opacity-100"
      >
        {signedIn ? `View Cart (${cart?.totalQuantity ?? 0} items)` : 'Login to view cart'}
        <div className="absolute right-2 top-full h-0 w-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-paper"></div>
      </div>
    </div>
  );
}
