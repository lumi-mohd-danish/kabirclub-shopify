import Image from 'next/image';

export const metadata = {
  title: 'About Us | Kabirclub',
  description: 'Discover the story behind Kabirclub - your premium destination for men\'s fashion.'
};

export default function AboutUsPage() {
  return (
    <main className="bg-black min-h-screen">
      {/* Hero section with gold gradient border */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#daa520] via-[#f5d76e] to-[#daa520]"></div>
        
        <div className="mx-auto max-w-[95%] md:max-w-[1100px]">
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-black to-[#111] p-6 md:p-12">
            {/* Decorative elements */}
            <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-[#daa520]/5 blur-3xl"></div>
            <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-[#daa520]/5 blur-3xl"></div>
            
            <h1 className="relative mb-6 font-lora text-4xl font-bold text-[#daa520] md:text-5xl lg:text-6xl">
              Our <span className="italic">Story</span>
            </h1>
            
            <div className="grid gap-12 md:grid-cols-2 md:gap-20">
              <div className="order-2 flex flex-col gap-6 text-gray-300 md:order-1">
                <p className="text-lg font-medium leading-relaxed">
                  Founded in 2018, Kabirclub started as a small boutique with a big vision - to provide men with clothing that combines quality, style, and affordability.
                </p>
                
                <p className="leading-relaxed">
                  What began as a passion project quickly evolved into a premier destination for men&apos;s fashion. Today, we pride ourselves on curating collections that help men express themselves through their unique style.
                </p>
                
                <div className="mt-4 flex items-center">
                  <div className="mr-4 h-px w-8 bg-[#daa520]"></div>
                  <p className="text-xl font-lora font-medium text-[#daa520]">Quality is our signature</p>
                </div>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="relative h-72 w-full overflow-hidden rounded-lg border border-[#daa520]/20 md:h-96">
                  <Image 
                    src="/images/about/founder.jpg" 
                    alt="Kabirclub founder" 
                    fill 
                    sizes="(min-width: 768px) 40vw, 90vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 max-w-[80%] rounded border-l-2 border-[#daa520] bg-black/30 p-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-[#daa520]">Founder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[95%] md:max-w-[1100px]">
          <div className="mb-12 text-center">
            <h2 className="font-lora text-3xl font-bold text-[#daa520] md:text-4xl">Our Values</h2>
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#daa520] to-transparent"></div>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Value 1 */}
            <div className="group flex flex-col items-center rounded-lg border border-[#daa520]/10 bg-black/40 p-6 text-center transition-all duration-300 hover:border-[#daa520]/30 hover:bg-black/60">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#daa520]/10 text-[#daa520] transition-all duration-300 group-hover:bg-[#daa520]/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#daa520]">Quality</h3>
              <p className="text-gray-400">We source only the finest materials to ensure our clothing stands the test of time.</p>
            </div>
            
            {/* Value 2 */}
            <div className="group flex flex-col items-center rounded-lg border border-[#daa520]/10 bg-black/40 p-6 text-center transition-all duration-300 hover:border-[#daa520]/30 hover:bg-black/60">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#daa520]/10 text-[#daa520] transition-all duration-300 group-hover:bg-[#daa520]/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#daa520]">Style</h3>
              <p className="text-gray-400">Our designs blend timeless classics with contemporary trends for versatile fashion.</p>
            </div>
            
            {/* Value 3 */}
            <div className="group flex flex-col items-center rounded-lg border border-[#daa520]/10 bg-black/40 p-6 text-center transition-all duration-300 hover:border-[#daa520]/30 hover:bg-black/60">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#daa520]/10 text-[#daa520] transition-all duration-300 group-hover:bg-[#daa520]/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#daa520]">Value</h3>
              <p className="text-gray-400">We believe premium fashion shouldn&apos;t come with a premium price tag.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Products section */}
      <section className="relative py-16 md:py-24">
        <div className="absolute right-0 top-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-[#daa520]/5 blur-[100px]"></div>
        
        <div className="mx-auto max-w-[95%] md:max-w-[1100px]">
          <div className="mb-12 text-center">
            <h2 className="font-lora text-3xl font-bold text-[#daa520] md:text-4xl">Our Collection</h2>
            <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#daa520] to-transparent"></div>
            <p className="mx-auto mt-6 max-w-2xl text-gray-400">
              Our carefully curated collections include everything a modern man needs in his wardrobe.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Product Category 1 */}
            <div className="group relative overflow-hidden rounded-lg">
              <div className="aspect-[4/5] w-full overflow-hidden" style={{position: 'relative'}}>
                <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/10"></div>
                <Image 
                  src="/images/about/shirts.jpg" 
                  alt="Shirts collection" 
                  fill 
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6">
                <h3 className="text-xl font-semibold text-[#daa520]">Shirts</h3>
                <p className="mt-1 text-sm text-gray-300">Classic designs with modern touches</p>
                <a 
                  href="/search/shirts" 
                  className="mt-3 inline-block border-b border-[#daa520] text-sm text-[#daa520] transition-all duration-300 hover:border-white hover:text-white"
                >
                  View Collection
                </a>
              </div>
            </div>
            
            {/* Product Category 2 */}
            <div className="group relative overflow-hidden rounded-lg">
              <div className="aspect-[4/5] w-full overflow-hidden" style={{position: 'relative'}}>
                <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/10"></div>
                <Image 
                  src="/images/about/shirts.jpg" 
                  alt="T-shirts collection" 
                  fill 
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6">
                <h3 className="text-xl font-semibold text-[#daa520]">T-Shirts</h3>
                <p className="mt-1 text-sm text-gray-300">Comfortable styles for everyday wear</p>
                <a 
                  href="/search/t-shirts" 
                  className="mt-3 inline-block border-b border-[#daa520] text-sm text-[#daa520] transition-all duration-300 hover:border-white hover:text-white"
                >
                  View Collection
                </a>
              </div>
            </div>
            
            {/* Product Category 3 */}
            <div className="group relative overflow-hidden rounded-lg">
              <div className="aspect-[4/5] w-full overflow-hidden" style={{position: 'relative'}}>
                <div className="absolute inset-0 bg-black/30 transition-opacity duration-300 group-hover:bg-black/10"></div>
                <Image 
                  src="/images/about/shirts.jpg" 
                  alt="Jeans collection" 
                  fill 
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black to-transparent p-6">
                <h3 className="text-xl font-semibold text-[#daa520]">Jeans</h3>
                <p className="mt-1 text-sm text-gray-300">Perfect fit for every body type</p>
                <a 
                  href="/search/jeans" 
                  className="mt-3 inline-block border-b border-[#daa520] text-sm text-[#daa520] transition-all duration-300 hover:border-white hover:text-white"
                >
                  View Collection
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[95%] md:max-w-[1100px]">
          <div className="relative overflow-hidden rounded-lg border border-[#daa520]/20 bg-gradient-to-r from-black/90 to-black p-8 md:p-12">
            <div className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-[#daa520]/10 blur-3xl"></div>
            
            <div className="relative z-10 grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <h2 className="font-lora text-3xl font-bold leading-tight text-[#daa520] md:text-4xl">
                  Ready to elevate your style?
                </h2>
                <p className="mt-4 text-gray-300">
                  Explore our latest collections and find your perfect look. Quality fabrics, stylish designs, and affordable luxury await.
                </p>
              </div>
              
              <div className="flex flex-col items-start justify-center">
                <a 
                  href="/collections/all" 
                  className="group relative overflow-hidden rounded-full border border-[#daa520] bg-[#daa520] px-8 py-3 text-black transition-all duration-300 hover:bg-transparent hover:text-[#daa520]"
                >
                  <span className="relative z-10">Shop Now</span>
                </a>
                <p className="mt-4 text-sm text-gray-400">Free shipping on orders over ₹1000</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 