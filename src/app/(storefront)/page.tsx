// next

// components
import AboutUs from '@/components/sections/AboutUs';
import BestSellers from '@/components/sections/BestSellers';
import Discounts from '@/components/sections/Discounts';
import HomeVideo from '@/components/sections/HomeVideo';
import NewArrivals from '@/components/sections/NewArrivals/NewArrivals';
import Promotions from '@/components/sections/Promotions';

export const metadata = {
  description: 'Kabirclub',
  keywords: ['Kabirclub', 'clothing', 'store', 'clothing store', 'e-commerce', 'mohd danish'],
  // openGraph: {
  //   type: 'website',
  //   locale: 'en_US',
  //   url: '/',
  //   title: 'Kabirclub',
  //   siteName: 'Kabirclub',
  //   description: 'Kabirclub Clothing store e-commerce website by Kabirclub',
  //   images: {
  //     url: '/images/screenshots/home.webp',
  //     alt: 'Kabirclub',
  //     width: 1200,
  //     height: 660,
  //     type: 'image/webp',
  //     secureUrl: '/images/screenshots/home.webp'
  //   }
  // }
};

export default async function HomePage() {
  return (
    <>
      <HomeVideo />
      <Discounts />
      <BestSellers />
      <Promotions />
      <NewArrivals />
      <AboutUs />
    </>
  );
}
