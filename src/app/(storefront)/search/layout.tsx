import { Suspense } from 'react';

/**
 * The catalogue is a PAPER ground: warm off-white, ink type. The ink bands are
 * reserved for chrome and editorial (header, hero, promo, footer, cart, admin),
 * so a listing of garments gets the neutral mat instead of a black page.
 *
 * The ground is painted here rather than inherited from <body> so the route
 * stays correct regardless of what the root layout is currently carrying.
 */
export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <div className="min-h-screen bg-paper text-ink">{children}</div>
    </Suspense>
  );
}
