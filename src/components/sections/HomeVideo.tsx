// next
import Link from 'next/link';

// components
import Logo from '@/components/layout/Logo';

/**
 * First frame shown while the hero clip is still loading, and the only thing
 * rendered when the visitor has asked for reduced motion (see below).
 */
const HERO_POSTER = '/images/hero-poster.jpg';

/**
 * Tailwind's `sm` breakpoint is `min-width: 640px`, so the two source queries
 * below line up exactly with the rest of the layout and never both match.
 */
const MOBILE_MEDIA = '(prefers-reduced-motion: no-preference) and (max-width: 639.98px)';
const DESKTOP_MEDIA = '(prefers-reduced-motion: no-preference) and (min-width: 640px)';

const HomeVideo = () => {
  return (
    <section className="relative h-[570px] w-full overflow-hidden sm:h-screen">
      {/*
        One video element, two candidate sources. The browser's resource
        selection runs the `media` queries and fetches at most ONE file.
        The two clips differ in ORIENTATION, not just weight: clothing-1 is
        480x854 (portrait, for phones) and clothing-2 is 854x480 (landscape,
        for desktop). Serving them the other way round crops the subject out
        of frame. Both are ~700KB, so orientation is the only thing that
        should decide. When the
        visitor prefers reduced motion neither query matches, no video is
        downloaded at all and the poster stays on screen as a still hero.
      */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
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

      {/* Content Box with Text - Compact version with subtitle */}
      <div className="absolute left-[50%] top-[50%] w-[80%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg text-center">
        {/* Very transparent background */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

        {/* Subtle border */}
        <div className="absolute inset-0 rounded-lg border border-[#daa520]/30"></div>

        {/* Content with text in the middle - Compact spacing */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 py-4 px-4 md:py-5 md:px-6">
          {/* Top decorative line */}
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#daa520]/50 to-transparent"></div>

          {/* Main text */}
          <h2 className="font-lora text-[clamp(20px,12px_+_2vw,28px)] font-bold leading-tight text-[#daa520] drop-shadow-md">
            Premium Indian Menswear
          </h2>

          {/* Subtitle - smaller and closer to main heading */}
          <p className="text-[clamp(12px,8px_+_1vw,16px)] font-medium text-white/90 drop-shadow-md">
            Shirts, tees, trousers and accessories.
          </p>

          {/* Primary call to action into the catalogue */}
          <Link
            href="/search"
            className="btn mt-3 mb-2 inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Shop the collection
          </Link>

          {/* Bottom decorative line */}
          <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#daa520]/50 to-transparent"></div>
        </div>
      </div>

      <Logo size="lg" className="absolute bottom-4 right-4 md:bottom-8 md:right-8" />
    </section>
  );
};

export default HomeVideo;
