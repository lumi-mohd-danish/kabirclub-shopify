'use client';

import { Product } from '@/lib/supabase/types';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ProductSliderProps {
  product: Product;
}

export default function ProductSlider({ product }: ProductSliderProps) {
  const images = product.images || ['/images/placeholder.png'];

  return (
    <div className="w-full">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}

      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative aspect-square overflow-hidden rounded-lg">
              <Image
                src={image}
                alt={`${product.title} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
