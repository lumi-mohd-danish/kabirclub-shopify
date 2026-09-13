// next
import Link from 'next/link';

/**
 * First frame shown while the hero clip is still loading, and the only thing
 * rendered when the visitor has asked for reduced motion (see below).
 */
const HERO_POSTER = '/images/hero-poster.jpg';

/**
 * These MUST track the breakpoint at which the film plate itself flips from
 * portrait to landscape — that is `lg:aspect-[16/11]` on the plate below, and
 * Tailwind's `lg` is `min-width: 1024px` (the config declares no custom
 * `screens`). Switching the sources any earlier pours the landscape clip into a
 * still-portrait 4/5 plate and `object-cover` crops the subject out of frame.
 * The two queries are exact complements, so they never both match, and neither
 * matches under reduced motion — no file is fetched and the poster stays.
 */
const MOBILE_MEDIA = '(prefers-reduced-motion: no-preference) and (max-width: 1023.98px)';
const DESKTOP_MEDIA = '(prefers-reduced-motion: no-preference) and (min-width: 1024px)';

/**
 * The hero is an editorial plate on an ink band: type sits on the ground BESIDE
 * the film rather than floating on top of it, so the gold is a guaranteed
 * 8.53:1 on ink-900 instead of a gamble against whatever frame is on screen.
 *
 * The vertical padding overrides `.section-band`'s 80/128/160 rhythm on `lg`
 * only. The band's height there is set by the viewport (`100svh` minus the
 * 80px header) so that the promo strip and the first product row always peek
 * above the fold; keeping 160px of padding inside that fixed height would
 * squeeze the film plate and clip it on a short laptop screen.
 */
const HomeVideo = () => {
  return (
    <section className="section-band grain flex items-center overflow-hidden py-12 md:py-16 lg:h-[calc(100svh-80px)] lg:max-h-[820px] lg:min-h-[560px] lg:py-0">
      <div className="container-page grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Editorial column */}
        <div className="flex flex-col items-start gap-5 lg:col-span-5">
          <p className="eyebrow text-zari-500">Est. India &middot; Menswear</p>
          <div className="rule-zari w-16" aria-hidden="true" />

          <h1 className="font-display text-display-1 text-paper">
            Cloth that keeps its shape.
            <br />
            And its story.
          </h1>

          <p className="max-w-[46ch] text-lead text-paper-muted">
            Shirts, tees, trousers and accessories.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/search?sort=created_at-desc" className="btn-primary">
              Shop New Arrivals
            </Link>
            <Link href="/about-us" className="thread-link-ink text-body text-zari-500">
              The Cloth
            </Link>
          </div>
        </div>

        {/* Film column */}
        <div className="flex flex-col lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-plate border border-zari-500/25 lg:aspect-[16/11]">
            {/*
              One video element, two candidate sources. The browser's resource
              selection runs the `media` queries and fetches at most ONE file.
              The two clips differ in ORIENTATION, not just weight: clothing-1 is
              480x854 (portrait, for phones) and clothing-2 is 854x480 (landscape,
              for desktop). Serving them the other way round crops the subject out
              of frame. Both are ~700KB, so orientation is the only thing that
              should decide — and what decides it is the plate's own aspect
              ratio, which is why these queries break at `lg` (1024px), where
              `lg:aspect-[16/11]` below turns the plate landscape. When the
              visitor prefers reduced motion neither query matches, no video is
              downloaded at all and the poster stays on screen as a still hero.
            */}
            <video
              className="h-full w-full object-cover"
              poster={HERO_POSTER}
              preload="metadata"
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
              tabIndex={-1}
            >
              <source src="/videos/clothing-1.mp4" type="video/mp4" media={MOBILE_MEDIA} />
              <source src="/videos/clothing-2.mp4" type="video/mp4" media={DESKTOP_MEDIA} />
            </video>
          </div>
          {/* The thread that ties the film to the ink ground. */}
          <div className="rule-zari" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
};

export default HomeVideo;
