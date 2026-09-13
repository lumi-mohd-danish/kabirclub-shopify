'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { PLACEHOLDER_IMAGE } from '@/lib/supabase/api';
import { cn } from '@/lib/utils';

/**
 * Every admin thumbnail, through `next/image`.
 *
 * The product table and both product forms rendered raw `<img>` behind
 * `// eslint-disable-next-line @next/next/no-img-element`, so admin shipped
 * full-size catalogue photographs — often 1920px wide — into 32px and 96px
 * boxes, with no lazy loading and no intrinsic size, which is also why the
 * table reflowed as it filled in.
 *
 * WHY THE `unoptimized` ESCAPE HATCH. `next/image`'s default loader validates
 * the host against `images.remotePatterns` in next.config.js and THROWS in
 * development when it does not match. Storefront images are ours (ImgBB, or a
 * local path), but admin is where arbitrary URLs are typed in by hand: the
 * collection image field, and the CSV/JSON bulk upload, both accept any URL a
 * merchandiser pastes. One bad host would take the whole page down rather than
 * showing a broken thumbnail. So a URL we know the optimiser will accept is
 * optimised, and anything else is passed through unoptimised — it still gets
 * the lazy loading, the reserved box and the decode hints, just not a resize.
 *
 * The host list mirrors next.config.js. It is deliberately a copy: this file
 * cannot read the Next config at runtime, and being wrong here is harmless in
 * both directions — a missing host only loses the resize, and an extra one
 * falls back to the same broken-image handling as any other failure.
 */
const OPTIMISABLE_HOSTS = new Set([
  'images.unsplash.com',
  'plus.unsplash.com',
  'i.ibb.co',
  'localhost',
  '127.0.0.1'
]);

function canOptimise(src: string): boolean {
  // A path served by this app is always fine.
  if (src.startsWith('/')) return true;

  try {
    return OPTIMISABLE_HOSTS.has(new URL(src).hostname);
  } catch {
    return false;
  }
}

export interface AdminThumbProps {
  src?: string | null;
  /** Empty string for a purely decorative thumbnail beside its own label. */
  alt: string;
  /**
   * Box utilities — `h-8 w-8` in a 40px table row, `h-24 w-full` in the form
   * grid. The image fills whatever this sets.
   */
  className?: string;
  /** Layout hint for the optimiser. Match the rendered box. */
  sizes?: string;
  /** Disabled products are dimmed in the listing. */
  dimmed?: boolean;
}

export default function AdminThumb({
  src,
  alt,
  className,
  sizes = '96px',
  dimmed = false
}: AdminThumbProps) {
  const [failed, setFailed] = useState(false);

  // A new URL deserves its own attempt; without this a single failure would
  // pin the placeholder in place for every product that reuses the row.
  useEffect(() => setFailed(false), [src]);

  const candidate = typeof src === 'string' && src.trim() ? src.trim() : '';
  const resolved = !candidate || failed ? PLACEHOLDER_IMAGE : candidate;

  return (
    // `paper-sunk` is the image mat, the one place it is correct on an ink
    // ground — it is a surface for photographs, never a panel for text.
    <span className={cn('relative block shrink-0 overflow-hidden bg-paper-sunk', className)}>
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        unoptimized={!canOptimise(resolved)}
        onError={() => setFailed(true)}
        className={cn('object-cover', dimmed && 'opacity-50')}
      />
    </span>
  );
}
