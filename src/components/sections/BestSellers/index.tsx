'use client';

// react
import { useState } from 'react';

// clsx
import clsx from 'clsx';

// components
import Slider from './Slider';

// types
const collections = ['Topwear', 'Bottomwear', 'Fragrances'] as const;
export type Collection = (typeof collections)[number];

const BestSellers = () => {
  const [activeCollection, setActiveCollection] = useState<Collection>('Topwear');
  return (
    <section className="section">
      <div className="container-page flex flex-col gap-10 md:gap-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
          <div className="flex flex-col gap-3">
            <p className="eyebrow text-ink-muted">The edit</p>
            <h2 className="font-display text-h2 text-ink">Best Sellers</h2>
          </div>

          {/*
            Collection filters. The active one is marked by the woven zari rule
            rather than by the old centre-out `before:` bar, and `aria-pressed`
            carries the same state for anyone not looking at it.
          */}
          <div className="flex flex-wrap gap-6 md:gap-8">
            {collections.map((collection, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={collection === activeCollection}
                className={clsx(
                  'eyebrow relative py-2 transition-colors duration-fast ease-cloth',
                  collection === activeCollection ? 'text-ink' : 'text-ink-muted hover:text-ink'
                )}
                onClick={() => setActiveCollection(collection)}
              >
                {collection}
                {collection === activeCollection && (
                  <span className="rule-zari absolute inset-x-0 bottom-0" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Slider collection={activeCollection} />
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
