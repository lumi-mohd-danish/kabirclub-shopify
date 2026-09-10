// supabase
import { getProducts } from '@/lib/supabase/api';

// components
import ProductList from './ProductList';

const NewArrivals = async () => {
  try {
    const result = await getProducts({
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 0,
      limit: 6
    });

    // Ensure products is always an array
    const safeProducts = Array.isArray(result.products) ? result.products : [];

    return (
      <section className="section">
        <div className="container-page flex flex-col gap-10 md:gap-14">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-ink-muted">Just in</p>
            <h2 className="font-display text-h2 text-ink">New Arrivals</h2>
          </div>

          <ProductList products={safeProducts} />

          {/*
            `created_at-desc` is the canonical slug the /search sort chips use
            (see src/app/search/page.tsx). The old `createdAt-desc` resolved to
            the same query through the fallback branch but left every chip
            reading as unselected on arrival.
          */}
          <div className="flex justify-center">
            <a href="/search?sort=created_at-desc" className="btn-secondary">
              View More
            </a>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Error loading New Arrivals:', error);
    // Return fallback UI if there's an error
    return (
      <section className="section">
        <div className="container-page flex flex-col gap-10 md:gap-14">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-ink-muted">Just in</p>
            <h2 className="font-display text-h2 text-ink">New Arrivals</h2>
          </div>
          <p className="text-body text-ink-muted">Loading products&hellip;</p>
        </div>
      </section>
    );
  }
};

export default NewArrivals;
