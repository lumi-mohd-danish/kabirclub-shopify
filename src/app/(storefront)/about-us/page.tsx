import Image from 'next/image';

export const metadata = {
  title: 'About Us | Kabirclub',
  description: "Discover the story behind Kabirclub - your premium destination for men's fashion."
};

export default function AboutUsPage() {
  return (
    <main className="bg-paper">
      {/* Hero — an ink band. Editorial chrome sits on ink; the catalogue sits on paper. */}
      <section className="section-band grain">
        <div className="container-page">
          <p className="eyebrow text-zari-500">Est. 2018 &middot; Menswear</p>
          <div className="rule-zari mt-5 w-16" />

          <h1 className="mt-6 font-display text-display-2 text-paper">
            Our <span className="text-zari-300">Story</span>
          </h1>

          <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-2 md:gap-16">
            <div className="order-2 flex flex-col gap-6 md:order-1">
              <p className="max-w-[46ch] text-lead text-paper">
                Founded in 2018, Kabirclub started as a small boutique with a big vision - to
                provide men with clothing that combines quality, style, and affordability.
              </p>

              <p className="max-w-[62ch] text-body text-paper-muted">
                What began as a passion project quickly evolved into a premier destination for
                men&apos;s fashion. Today, we pride ourselves on curating collections that help men
                express themselves through their unique style.
              </p>

              <div className="mt-2 flex items-center gap-4">
                <div className="rule-zari w-8 shrink-0" />
                <p className="text-h3 text-zari-300">Quality is our signature</p>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <figure className="relative aspect-[4/5] w-full overflow-hidden rounded-plate border border-ink-700 bg-ink-800">
                <Image
                  src="/images/about/founder.jpg"
                  alt="Kabirclub founder"
                  fill
                  sizes="(min-width: 768px) 40vw, 90vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 to-transparent"></div>
                <figcaption className="absolute bottom-4 left-4 max-w-[80%] border-l border-zari-500 bg-ink-900/85 px-3 py-2">
                  <span className="eyebrow text-zari-300">Founder</span>
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values — paper document ground. */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto mb-12 max-w-[62ch] text-center md:mb-16">
            <p className="eyebrow text-ink-muted">What we stand for</p>
            <h2 className="mt-3 font-display text-h2 text-ink">Our Values</h2>
            <div className="rule-zari mx-auto mt-5 w-16" />
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {/* Value 1 */}
            <div className="flex flex-col items-center rounded-plate border border-line bg-paper-raised p-8 text-center transition-shadow duration-fast ease-cloth hover:shadow-card">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-5 h-8 w-8 text-zari-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <h3 className="text-h3 text-ink">Quality</h3>
              <p className="mt-2 text-body text-ink-muted">
                We source only the finest materials to ensure our clothing stands the test of time.
              </p>
            </div>

            {/* Value 2 */}
            <div className="flex flex-col items-center rounded-plate border border-line bg-paper-raised p-8 text-center transition-shadow duration-fast ease-cloth hover:shadow-card">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-5 h-8 w-8 text-zari-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-h3 text-ink">Style</h3>
              <p className="mt-2 text-body text-ink-muted">
                Our designs blend timeless classics with contemporary trends for versatile fashion.
              </p>
            </div>

            {/* Value 3 */}
            <div className="flex flex-col items-center rounded-plate border border-line bg-paper-raised p-8 text-center transition-shadow duration-fast ease-cloth hover:shadow-card">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mb-5 h-8 w-8 text-zari-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-h3 text-ink">Value</h3>
              <p className="mt-2 text-body text-ink-muted">
                We believe premium fashion shouldn&apos;t come with a premium price tag.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Collection — still paper, so the woven rule does the separation. */}
      <section className="section pt-0">
        <div className="container-page">
          <div className="rule-zari" />

          <div className="mx-auto mb-12 mt-16 max-w-[62ch] text-center md:mb-16 md:mt-24">
            <p className="eyebrow text-ink-muted">The wardrobe</p>
            <h2 className="mt-3 font-display text-h2 text-ink">Our Collection</h2>
            <p className="mt-5 text-body text-ink-muted">
              Our carefully curated collections include everything a modern man needs in his
              wardrobe.
            </p>
          </div>

          <div className="grid gap-x-6 gap-y-10 md:grid-cols-3 md:gap-y-14">
            {/* Product Category 1 */}
            <article className="group">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-plate bg-paper-sunk transition-shadow duration-fast ease-cloth group-hover:shadow-card">
                <Image
                  src="/images/about/shirts.jpg"
                  alt="Shirts collection"
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 text-h3 text-ink">Shirts</h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                Classic designs with modern touches
              </p>
              <a
                href="/search/shirts"
                className="thread-link mt-3 text-body font-medium text-zari-700"
              >
                View Collection
              </a>
            </article>

            {/* Product Category 2 */}
            <article className="group">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-plate bg-paper-sunk transition-shadow duration-fast ease-cloth group-hover:shadow-card">
                <Image
                  src="/images/about/shirts.jpg"
                  alt="T-shirts collection"
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 text-h3 text-ink">T-Shirts</h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                Comfortable styles for everyday wear
              </p>
              <a
                href="/search/t-shirts"
                className="thread-link mt-3 text-body font-medium text-zari-700"
              >
                View Collection
              </a>
            </article>

            {/* Product Category 3 */}
            <article className="group">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-plate bg-paper-sunk transition-shadow duration-fast ease-cloth group-hover:shadow-card">
                <Image
                  src="/images/about/shirts.jpg"
                  alt="Jeans collection"
                  fill
                  sizes="(min-width: 768px) 30vw, 90vw"
                  className="object-cover"
                />
              </div>
              <h3 className="mt-5 text-h3 text-ink">Jeans</h3>
              <p className="mt-1 text-body-sm text-ink-muted">Perfect fit for every body type</p>
              <a
                href="/search/jeans"
                className="thread-link mt-3 text-body font-medium text-zari-700"
              >
                View Collection
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* Call to action — the closing ink band carries the one gold fill on this page. */}
      <section className="section-band grain">
        <div className="container-page">
          <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
            <div>
              <p className="eyebrow text-zari-500">Next</p>
              <div className="rule-zari mt-5 w-16" />
              <h2 className="mt-6 font-display text-h1 text-paper">Ready to elevate your style?</h2>
              <p className="mt-5 max-w-[46ch] text-lead text-paper-muted">
                Explore our latest collections and find your perfect look. Quality fabrics, stylish
                designs, and affordable luxury await.
              </p>
            </div>

            <div className="flex flex-col items-start justify-center gap-4">
              <a href="/collections/all" className="btn-primary">
                Shop Now
              </a>
              <p className="text-body-sm text-paper-muted">
                Free shipping on orders over <span className="num">&#8377;1000</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
