'use client';

import ProductCard from '@/components/layout/ProductCard';
import { getProducts } from '@/lib/supabase/api';
import { Product } from '@/lib/supabase/types';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const categories = ['All', 'Topwear', 'Bottomwear', 'Accessories'] as const;

/**
 * NOTE: nothing imports this file — `src/app/page.tsx` renders
 * `sections/BestSellers/index.tsx` instead. It is repainted here so it does not
 * sit in the tree as the last surviving reference to the deleted `*Purple`
 * tokens and the hardcoded gold, but it should be deleted outright.
 */
export default function BestSellers() {
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (category: (typeof categories)[number]) => {
    try {
      setLoading(true);
      const data = await getProducts({
        category: category === 'All' ? undefined : category,
        limit: 6,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching best sellers:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(activeCategory);
  }, [activeCategory]);

  const handleCategoryChange = (category: (typeof categories)[number]) => {
    setActiveCategory(category);
  };

  return (
    <section className="section">
      <div className="container-page flex flex-col gap-10 md:gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="eyebrow text-ink-muted">The edit</p>
          <h1 className="font-display text-h1 text-ink">Best Sellers</h1>
          <p className="max-w-[62ch] text-lead text-ink-muted">
            Discover our most popular products
          </p>
        </div>

        <div className="flex justify-center overflow-x-auto">
          <div className="flex min-w-max items-center gap-6 px-2 md:gap-8">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => handleCategoryChange(category)}
                className={`eyebrow relative whitespace-nowrap py-2 transition-colors duration-fast ease-cloth ${
                  activeCategory === category ? 'text-ink' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {category}
                {activeCategory === category && (
                  <motion.span
                    layoutId="activeCategory"
                    aria-hidden="true"
                    className="rule-zari absolute inset-x-0 bottom-0"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-pill border-2 border-zari-700 border-t-transparent" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                // Capped stagger: the tail of a long list must not queue up
                // seconds of delay behind the first row.
                transition={{ duration: 0.52, delay: Math.min(index, 6) * 0.04 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-lead text-ink-muted">No products found</p>
            <div className="rule-zari w-16" aria-hidden="true" />
          </div>
        )}
      </div>
    </section>
  );
}
