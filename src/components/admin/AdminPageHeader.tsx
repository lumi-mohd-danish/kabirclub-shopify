import type { ReactNode } from 'react';

import SectionHeading from '@/components/common/SectionHeading';

/**
 * The one admin page header.
 *
 * All six /admin screens hand-assembled the same three parts — eyebrow, gold
 * rule, h1 — and had already drifted into two different orders (two pages put
 * the rule under the heading, the rest above it) and two different gaps.
 *
 * It renders `SectionHeading` at `density="compact"` and `tone="ink"`, which
 * is the admin pairing: the narrower w-12 thread, tighter gaps, and the
 * `zari-500` eyebrow that only an ink ground may carry. The supporting line is
 * 13px `text-caption`, not the storefront's `body-sm`/`lead`, because this is a
 * tool.
 *
 * Server component by design: no state, no handlers.
 */
export interface AdminPageHeaderProps {
  /** Required, exactly as `SectionHeading` requires it. */
  eyebrow: string;
  title: ReactNode;
  /** One short line under the heading. Optional. */
  description?: ReactNode;
  /** Page-level controls — normally the single primary action. */
  actions?: ReactNode;
}

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <SectionHeading eyebrow={eyebrow} title={title} as="h1" tone="ink" density="compact" />
        {description ? <p className="mt-2 text-caption text-paper-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
