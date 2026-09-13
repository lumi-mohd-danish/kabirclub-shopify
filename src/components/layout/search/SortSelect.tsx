'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useId, useState, useTransition } from 'react';

/**
 * The catalogue's ONE sort control.
 *
 * It replaced a row of chips that was rebuilt on both listing routes, rendered
 * four buttons at 14px, and told a screen reader which sort was active only
 * through `aria-pressed` on a control that looked like a link. A native
 * `<select>` with a real `<label>` is the honest element for "pick one of four":
 * it is keyboard operable everywhere (including on a phone, where the chip row
 * wrapped onto three lines), it announces its own name and value, and it picks
 * up the shared focus-visible ring from globals.css without any help.
 *
 * The hrefs are computed on the server and handed in, so this component reads
 * no search params and ships no URL-building logic to the browser — it only
 * navigates.
 */

export interface SortSelectOption {
  label: string;
  /** The `?sort=` slug, used as the option value. */
  value: string;
  /** Where choosing this option goes. Built server-side from the current URL. */
  href: string;
}

export default function SortSelect({
  options,
  value,
  label = 'Sort by'
}: {
  options: SortSelectOption[];
  /** The slug currently in effect. Must match one of `options`. */
  value: string;
  label?: string;
}) {
  const router = useRouter();
  const selectId = useId();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value);

  // The server is the source of truth: a Back/Forward navigation, or a sort
  // cleared by another control, has to be reflected here rather than leaving
  // the select showing a choice that is no longer in the URL.
  useEffect(() => {
    setSelected(value);
  }, [value]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* A real label, not a placeholder option: the control keeps its name
          after a value is chosen, which is exactly when a screen-reader user
          needs to know what the value means. */}
      <label htmlFor={selectId} className="eyebrow text-ink-muted">
        {label}
      </label>

      {/*
        `.field` is the shared paper form recipe — 16px type (below that iOS
        zooms the page on focus), `rounded-control`, and an `ink-faint` hairline
        that clears WCAG 1.4.11's 3:1 for a control boundary. It is declared
        `block w-full`; `w-auto` sits in the utilities layer and so wins, which
        is what turns the full-width form field into a toolbar control. `pr-10`
        keeps the native disclosure arrow off the type.
      */}
      <select
        id={selectId}
        name="sort"
        value={selected}
        aria-busy={pending}
        onChange={(event) => {
          const next = options.find((option) => option.value === event.target.value);

          if (!next) return;

          setSelected(next.value);
          startTransition(() => {
            router.push(next.href);
          });
        }}
        className="field w-auto max-w-full pr-10"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
