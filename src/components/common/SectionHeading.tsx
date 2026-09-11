import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The signature Ink & Zari heading composite.
 *
 * Three parts, always in this order, never optional:
 *
 *   1. the eyebrow   — `.eyebrow` (11px / 0.18em / 600 / uppercase)
 *   2. the thread     — `<div className="rule-zari w-16" />`
 *   3. the heading    — h1 / h2 / h3 off the numeric type scale
 *
 * It had been assembled four different ways across the site, and two page
 * headers dropped the eyebrow entirely, which also dropped the rule and left
 * the heading floating with no thread above it. Rebuilding it by hand is what
 * caused that, so this is the only place it gets built.
 *
 * EYEBROW COLOUR IS SURFACE-DEPENDENT and is handled here rather than left to
 * the caller, because that is the part call sites kept getting wrong:
 *   tone="paper" -> `text-ink-muted` (5.61:1)
 *   tone="ink"   -> `text-zari-500`  (8.53:1 on ink-900)
 * Never `text-ink-faint`: 3.66:1 is allowed only at 16px+, and an eyebrow is
 * 11px, so it needs the full 4.5:1.
 *
 * Server component by design — it holds no state and takes no handlers, so it
 * must not carry a 'use client' boundary into the pages that render it.
 */

/** Heading level. Drives both the type size and the family. */
export type SectionHeadingAs = 'h1' | 'h2' | 'h3';

/** Which ground the heading is painted on. Decides all three colours. */
export type SectionHeadingTone = 'paper' | 'ink';

export type SectionHeadingAlign = 'left' | 'center';

/**
 * `compact` is the admin/panel density: a narrower w-12 thread and tighter
 * gaps, for stat tiles and drawer headers where the storefront's w-16 rule
 * overpowers the block.
 */
export type SectionHeadingDensity = 'default' | 'compact';

export interface SectionHeadingProps {
  /**
   * Required. The eyebrow is part of the composite, not a decoration — a
   * heading without one is the defect this component exists to prevent.
   */
  eyebrow: string;
  title: ReactNode;
  /** Default 'h2'. Exactly one `h1` per page. */
  as?: SectionHeadingAs;
  /** Default 'left'. */
  align?: SectionHeadingAlign;
  /** Default 'paper'. Use 'ink' inside `.section-band` and on the ink pages. */
  tone?: SectionHeadingTone;
  /** Default 'default'. Use 'compact' in admin. */
  density?: SectionHeadingDensity;
  /** Outer-block utilities only — spacing, max-width. Not colour. */
  className?: string;
}

/**
 * Fraunces (`font-display`) runs display-1 -> h2 only; h3 and below are Hanken
 * (`font-sans`), per the type scale in tailwind.config.js.
 */
const HEADING_CLASS: Record<SectionHeadingAs, string> = {
  h1: 'text-h1 font-display',
  h2: 'text-h2 font-display',
  h3: 'text-h3 font-sans'
};

const EYEBROW_TONE: Record<SectionHeadingTone, string> = {
  paper: 'text-ink-muted',
  ink: 'text-zari-500'
};

const TITLE_TONE: Record<SectionHeadingTone, string> = {
  paper: 'text-ink',
  ink: 'text-paper'
};

/** Thread width. The rule's own CSS is width:100%, so this utility sets it. */
const RULE_WIDTH: Record<SectionHeadingDensity, string> = {
  default: 'w-16',
  compact: 'w-12'
};

/** Gap above the thread, then above the heading. */
const RULE_GAP: Record<SectionHeadingDensity, string> = {
  default: 'mt-3',
  compact: 'mt-2'
};

const TITLE_GAP: Record<SectionHeadingDensity, string> = {
  default: 'mt-4',
  compact: 'mt-3'
};

export default function SectionHeading({
  eyebrow,
  title,
  as = 'h2',
  align = 'left',
  tone = 'paper',
  density = 'default',
  className
}: SectionHeadingProps) {
  const Heading = as;

  return (
    <div
      className={cn(
        'flex flex-col',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className
      )}
    >
      <p className={cn('eyebrow', EYEBROW_TONE[tone])}>{eyebrow}</p>

      <div className={cn('rule-zari', RULE_WIDTH[density], RULE_GAP[density])} />

      <Heading className={cn(HEADING_CLASS[as], TITLE_TONE[tone], TITLE_GAP[density])}>
        {title}
      </Heading>
    </div>
  );
}
