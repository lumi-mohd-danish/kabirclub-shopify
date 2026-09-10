'use client';

import Link from 'next/link';
import { useEffect } from 'react';

function AlertIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.3 3.9 1.8 18.4A2 2 0 0 0 3.5 21.4h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

/**
 * The root error boundary. It must stay a client component — Next.js hands it
 * `reset()`, and the retry has to run in the browser.
 *
 * Paper ground and the same centred composition as the 404, so the two
 * failure states read as one system. `madder` (#9A3324, 6.61:1 on paper) is
 * the state colour and it is the only place red appears: the eyebrow and the
 * badge glyph. It is NOT used as a fill behind the copy — a red panel would
 * make a recoverable render error look like a payment failure.
 *
 * Gold appears exactly once, on the retry, which is correctly the primary
 * action here: `.btn-primary` is bg-zari-500 + text-ink at 8.16:1.
 */
export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // The only channel a production failure has: `no-console` allows
  // console.error, and next.config.js `compiler.removeConsole` deliberately
  // excludes it from the strip.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="container-page section flex flex-col items-center gap-10 text-center">
      <div className="flex flex-col items-center gap-5">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill border border-line-strong bg-paper-sunk text-madder">
          <AlertIcon />
        </span>

        <p className="eyebrow text-madder">Something went wrong</p>

        <div className="rule-zari w-16" aria-hidden="true" />

        <h1 className="font-display text-h1 text-ink">This page did not load</h1>

        <p className="max-w-[62ch] text-lead text-ink-muted">
          The fault is at our end, not with your cart or your order. Trying again usually clears it.
          If it does not,{' '}
          <Link href="/contact" className="thread-link font-medium text-zari-700">
            get in touch
          </Link>{' '}
          and we will sort it out.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <Link href="/" className="btn-secondary">
          Back to home
        </Link>
      </div>

      {/* The support handle for this exact failure. Next.js only sets `digest`
          on server errors in production, so the line simply does not render
          in development or for a client-side throw. */}
      {error.digest ? (
        <p className="num text-caption text-ink-muted">Reference: {error.digest}</p>
      ) : null}
    </section>
  );
}
