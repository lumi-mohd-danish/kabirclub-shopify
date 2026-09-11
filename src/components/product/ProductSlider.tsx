'use client';

import { Product } from '@/lib/supabase/types';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import type { Swiper as SwiperInstance } from 'swiper';
import { A11y, Keyboard, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/pagination';

interface ProductSliderProps {
  product: Product;
}

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/**
 * The gallery is the PDP's whole first impression, so it renders at the plate
 * standard: 3:4 on the `paper-sunk` mat, hairline chrome, no radius.
 *
 * This component absorbed `product/gallery.tsx`, which had zero importers and
 * tracked the current image in a `?image=N` search param — that made the whole
 * route opt out of static rendering (a `useSearchParams` client boundary), put
 * gallery state in the shopper's history stack, and gave phones no swipe at
 * all. Its two genuinely better ideas were kept and moved here: the thumbnail
 * rail, and framed arrow chrome that stays legible over a dark garment instead
 * of Swiper's bare 24px glyphs. Its `rounded-pill` chrome did NOT come with it:
 * the pill radius is reserved for avatars and badges, so the arrows are
 * `rounded-control` like every other button in the system.
 *
 * Chrome is split by input rather than stacked: phones get swipe plus the
 * bullets, pointer viewports get the arrows, the thumbnail rail and arrow keys.
 */

/**
 * Swiper paints its arrows and bullets from its own CSS custom properties,
 * which no Tailwind class can reach. Handing it the `ink` token verbatim is
 * the only way to stop it drawing the library's default `#007aff` blue on a
 * page that has no blue in it.
 */
const SWIPER_THEME = {
  '--swiper-theme-color': '#1C1714',
  '--swiper-navigation-size': '24px',
  // The bullets are the only indicator of position in the gallery, so they are a
  // UI component and owe 3:1 (WCAG 1.4.11). Swiper ships inactive bullets at
  // `opacity: 0.2`, which caps them at roughly 1.2:1 on any ground no matter what
  // colour they are painted — so the opacity is forced back to 1 and the colour
  // does the work: `ink-muted` is 5.10:1 on the `paper-sunk` mat behind the plate.
  '--swiper-pagination-bullet-inactive-color': '#6B5F52',
  '--swiper-pagination-bullet-inactive-opacity': '1',
  // The active bullet is the metal for paper (zari-700, 4.85:1 on the mat), and
  // both sit far enough off the bottom edge to clear the photograph's hem.
  '--swiper-pagination-color': '#8A6410',
  '--swiper-pagination-bullet-size': '7px',
  '--swiper-pagination-bullet-horizontal-gap': '5px',
  '--swiper-pagination-bottom': '12px'
} as React.CSSProperties;

/** Arrow chrome: a 44px control on a translucent plate, legible on any photo. */
const ARROW_CLASS =
  'pointer-events-auto hidden h-11 w-11 items-center justify-center rounded-control border border-line bg-paper-raised/90 text-ink-muted backdrop-blur transition-colors duration-fast ease-cloth hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-muted sm:flex';

/** Images arrive from the database, so they can be null, padded or blank. */
function normaliseImages(images: Product['images']): string[] {
  if (!Array.isArray(images)) return [PLACEHOLDER_IMAGE];

  const cleaned = images
    .filter((image): image is string => typeof image === 'string')
    .map((image) => image.trim())
    .filter((image) => image && image !== 'undefined' && image !== 'null');

  return cleaned.length ? cleaned : [PLACEHOLDER_IMAGE];
}

export default function ProductSlider({ product }: ProductSliderProps) {
  const images = normaliseImages(product.images);
  const hasMultiple = images.length > 1;

  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Swiper's own `activeIndex` is a plain property on a mutable instance and
  // never triggers a render, so it is mirrored into state on every change —
  // that is what keeps the thumbnail highlight and the arrows' disabled state
  // honest instead of leaving arrows that silently do nothing at the ends.
  const syncFromSwiper = useCallback((instance: SwiperInstance) => {
    setActiveIndex(instance.activeIndex);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      swiper?.slideTo(index);
    },
    [swiper]
  );

  return (
    <div className="w-full" style={SWIPER_THEME}>
      {/* The arrows are positioned against this wrapper, whose height is the
          photograph's — so `top-1/2` is the optical centre of the image. */}
      <div className="relative">
        <Swiper
          modules={[A11y, Keyboard, Pagination]}
          spaceBetween={24}
          slidesPerView={1}
          pagination={{ clickable: true }}
          // `pageUpDown: false` matters: the gallery is in the viewport for the
          // whole PDP, and Swiper's keyboard module would otherwise swallow
          // Page Up / Page Down and stop the page scrolling. Its handler
          // already bails when focus is in an <input>, so the size radios keep
          // their own arrow-key behaviour.
          keyboard={{ enabled: true, onlyInViewport: true, pageUpDown: false }}
          a11y={{
            containerMessage: `${product.title} image gallery`,
            prevSlideMessage: 'Previous product image',
            nextSlideMessage: 'Next product image',
            paginationBulletMessage: 'Go to product image {{index}}'
          }}
          onSwiper={setSwiper}
          onSlideChange={syncFromSwiper}
          // Bullets are the phone's position indicator; from `sm` up the
          // thumbnail rail below does that job and the bullets would be a
          // second answer to the same question.
          className="[&_.swiper-pagination]:sm:hidden"
          // The 3s autoplay is gone. A gallery that moves itself steals the
          // photograph out from under the shopper mid-look, and it is one of the
          // loops this direction removes outright.
        >
          {images.map((image, index) => (
            <SwiperSlide key={`${image}-${index}`}>
              {/*
                3:4 on the paper mat — the same plate standard as the catalogue
                card. Portrait is how menswear is shot; a square crop takes the
                head off a full-length frame.
              */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-plate bg-paper-sunk">
                <Image
                  src={image}
                  alt={`${product.title} — image ${index + 1} of ${images.length}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  // Only the frame that is actually above the fold is a
                  // preload candidate; marking all of them would have the
                  // browser fight itself for the one that matters.
                  priority={index === 0}
                  unoptimized={image === PLACEHOLDER_IMAGE}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {hasMultiple && (
          <div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-between">
            <button
              type="button"
              aria-label="Previous product image"
              className={ARROW_CLASS}
              disabled={activeIndex === 0}
              onClick={() => swiper?.slidePrev()}
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next product image"
              className={ARROW_CLASS}
              disabled={activeIndex >= images.length - 1}
              onClick={() => swiper?.slideNext()}
            >
              <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* The thumbnail rail, adopted from the deleted gallery — rebuilt on this
          component's own markup rather than on `GridTileImage`, whose only
          other caller has gone and which carries a catalogue-card hover the
          rail does not want. Real buttons, not links: choosing which photo is
          on the plate is not navigation and has no business in the back
          button, which is precisely what the `?image=N` gallery got wrong.

          The rail's negative margin only buys the focus ring room to draw at
          its ends; the matching padding puts the first thumbnail back on the
          gallery's left edge, so the rail still lines up with the plate. */}
      {hasMultiple && (
        <ul className="-mx-1 mt-4 hidden items-center gap-3 overflow-x-auto p-1 sm:flex">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <li key={`thumb-${image}-${index}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Show image ${index + 1} of ${images.length}`}
                  aria-current={isActive ? 'true' : undefined}
                  // 72 x 96 is the plate's own 3:4, so the thumbnail is the
                  // crop the shopper is about to get rather than a square that
                  // trims the garment differently from the frame it opens.
                  className={`relative block h-24 w-[72px] overflow-hidden rounded-plate border bg-paper-sunk transition-colors duration-fast ease-cloth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                    isActive
                      ? 'border-zari-700 ring-1 ring-inset ring-zari-700'
                      : 'border-line hover:border-ink-faint'
                  }`}
                >
                  {/* Decorative: the button's own label already names the
                      frame, and the main image carries the real alt text. */}
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="72px"
                    className="object-cover object-center"
                    unoptimized={image === PLACEHOLDER_IMAGE}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
