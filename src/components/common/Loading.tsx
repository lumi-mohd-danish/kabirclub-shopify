/**
 * The shared inline loading indicator, for a panel or a region that is
 * fetching — not for a whole route (`src/app/loading.tsx` and
 * `src/app/search/loading.tsx` draw skeletons in the shape of the content
 * instead, which is always the better answer at page level).
 *
 * It no longer wraps `react-loading`. That library paints its spokes with an
 * inline `fill`/`color` attribute, which meant the tone had to be handed over
 * as a hardcoded hex — it was `#9d9cc9`, a cool lilac from the deleted
 * `*Purple` palette, on a warm-paper page. A hex prop cannot follow the token
 * layer, a spinning wheel of spokes is exactly the UI-kit register this
 * design rules out ("cloth, not UI"), and dropping the dependency also drops
 * the `'use client'` boundary: this is now a server component.
 *
 * What is left is the identity device at rest: the woven zari rule, pulsing,
 * over a letterspaced label. `react-loading` is now unreferenced anywhere in
 * `src` and can come out of package.json.
 *
 * Paper variant. On an ink ground the label needs `text-paper-muted`; the
 * rule is zari-500 and reads correctly on both.
 */
const Loading = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full flex-col items-center justify-center gap-4 py-12"
    >
      <span aria-hidden="true" className="rule-zari w-16 animate-pulse" />
      <span className="eyebrow text-ink-muted">Loading</span>
    </div>
  );
};

export default Loading;
