'use client';

import { Product } from '@/lib/supabase/types';
import Image from 'next/image';
import { Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductSliderProps {
  product: Product;
}

/**
 * Swiper paints its arrows and bullets from its own CSS custom properties,
 * which no Tailwind class can reach. Handing it the `ink` token verbatim is
 * the only way to stop it drawing the library's default `#007aff` blue on a
 * page that has no blue in it.
 */
const SWIPER_THEME = {
  '--swiper-theme-color': '#1C1714',
  '--swiper-navigation-size': '24px',
  '--swiper-pagination-bullet-inactive-color': '#8A7C6C'
} as React.CSSProperties;

export default function ProductSlider({ product }: ProductSliderProps) {
  const images = product.images?.length ? product.images : ['/images/placeholder.png'];

  return (
    <div className="w-full" style={SWIPER_THEME}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={24}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        // The 3s autoplay is gone. A gallery that moves itself steals the
        // photograph out from under the shopper mid-look, and it is one of the
        // loops this direction removes outright.
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            {/*
              3:4 on the paper mat — the same plate standard as the catalogue
              card. Portrait is how menswear is shot; a square crop takes the
              head off a full-length frame.
            */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-plate bg-paper-sunk">
              <Image
                src={image}
                alt={`${product.title} - Image ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
