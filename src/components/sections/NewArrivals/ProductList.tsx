'use client';

import clsx from 'clsx';
import { useRef, useState } from 'react';
import 'swiper/css';
import 'swiper/css/navigation';
import { A11y, Navigation } from 'swiper/modules';
import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { Product } from '../../../lib/supabase/types';
import ProductCard from '../../product/ProductCard';

interface ProductListProps {
  products?: Product[];
}

/**
 * The loading plate. Same geometry as a real product plate — a 3:4 mat with
 * two type bars under it — so the row does not reflow when the data lands.
 */
const ProductSkeleton = () => (
  <div className="flex w-full flex-col gap-3">
    <div className="aspect-[3/4] w-full rounded-plate bg-paper-sunk" />
    <div className="flex flex-col gap-2">
      <div className="h-3 rounded-xs bg-line" />
      <div className="h-2 w-3/4 rounded-xs bg-line" />
    </div>
  </div>
);

const ProductList = ({ products = [] }: ProductListProps) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isStart, setIsStart] = useState(false);
  const [isEnd, setIsEnd] = useState(false);
  const swiper = useRef<SwiperClass | null>(null);

  // If no products, show empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-center text-lead text-ink-muted">No products available</p>
        <div className="rule-zari w-16" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isMobile ? (
        // Tight horizontal gutters, generous vertical ones: that asymmetry is
        // what makes a catalogue read as editorial rather than as a table.
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-10">
          {products.slice(0, 4).map((product) => (
            <div key={product.id}>
              {product && product.id ? <ProductCard product={product} /> : <ProductSkeleton />}
            </div>
          ))}
        </div>
      ) : (
        <Swiper
          modules={[Navigation, A11y]}
          slidesPerView={1.1}
          spaceBetween={16}
          slidesOffsetBefore={16}
          slidesOffsetAfter={16}
          freeMode={false}
          grabCursor={false}
          watchSlidesProgress={true}
          preventInteractionOnTransition={true}
          breakpoints={{
            0: {
              slidesPerView: 1.1,
              spaceBetween: 16,
              slidesOffsetBefore: 16,
              slidesOffsetAfter: 16,
              watchSlidesProgress: true,
              preventInteractionOnTransition: true
            },
            480: {
              slidesPerView: 1.5,
              spaceBetween: 16,
              slidesOffsetBefore: 16,
              slidesOffsetAfter: 16
            },
            768: {
              slidesPerView: 2.5,
              spaceBetween: 32,
              slidesOffsetBefore: 32,
              slidesOffsetAfter: 32
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 32,
              slidesOffsetBefore: 0,
              slidesOffsetAfter: 0
            }
          }}
          navigation={{ nextEl: 'swiper-button-next', prevEl: 'swiper-button-prev' }}
          onSwiper={(s) => {
            swiper.current = s;
          }}
          onSlidesUpdated={(s) => {
            setIsEnd(s.isEnd);
            setIsStart(s.isBeginning);
          }}
          onSlideChange={(s) => {
            setIsEnd(s.isEnd);
            setIsStart(s.isBeginning);
          }}
        >
          {products.map((product) => (
            <SwiperSlide key={product.id} className="!w-[180px] sm:!w-[280px]">
              <div key={product.id}>
                {product && product.id ? <ProductCard product={product} /> : <ProductSkeleton />}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
      {/*
        Carousel arrows. `top-1/2` rather than a hardcoded `top-[180px]` pinned
        to the old card height, and -right-8 / -left-8 keeps them inside
        .container-page's own lg gutter.
      */}
      {!isMobile && (
        <>
          <button
            className={clsx(
              'absolute -right-8 top-1/2 hidden -translate-y-1/2 font-[swiper-icons] text-4xl transition-colors duration-fast ease-cloth lg:block',
              isEnd ? 'text-ink-faint' : 'text-ink-muted hover:text-ink'
            )}
            onClick={() => swiper.current?.slideNext()}
            disabled={isEnd}
          >
            next
          </button>
          <button
            className={clsx(
              'absolute -left-8 top-1/2 hidden -translate-y-1/2 font-[swiper-icons] text-4xl transition-colors duration-fast ease-cloth lg:block',
              isStart ? 'text-ink-faint' : 'text-ink-muted hover:text-ink'
            )}
            onClick={() => swiper.current?.slidePrev()}
            disabled={isStart}
          >
            prev
          </button>
        </>
      )}
    </div>
  );
};

export default ProductList;
