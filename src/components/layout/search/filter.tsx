'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ListItem {
  title: string;
  slug: string;
}

export default function FilterList({ list }: { list: ListItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    const sort = searchParams.get('sort');
    if (sort) {
      setActiveFilter(sort);
    }
  }, [searchParams]);

  const handleSortChange = (slug: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('sort', slug);
    router.push(`${pathname}?${newParams.toString()}`);
  };

  return (
    <div className="flex items-center gap-4">
      <ul className="flex flex-wrap gap-2">
        {list.map((item) => {
          const active = activeFilter === item.slug;

          return (
            <li key={item.slug}>
              {/*
                Sort chips on the catalogue's PAPER ground. The selected chip
                takes an ink fill (16.1:1) rather than a gold one: gold is a
                thread in this system, and a state marker is not the one filled
                gold element a view is allowed. Idle chips borrow the metal as a
                hairline on hover but keep ink type, because a chip is 14px and
                zari-700 is only AA from 16px up.

                `aria-pressed` is what tells a screen reader which sort is
                active - previously that was carried by colour alone. The
                `animate-ping` halo is gone: an infinite pulse on the current
                sort is exactly the UI-kit tic this direction removes.
              */}
              <button
                type="button"
                aria-pressed={active}
                onClick={() => handleSortChange(item.slug)}
                className={`inline-block rounded-control border px-5 py-2.5 text-body-sm font-medium transition-colors duration-fast ease-cloth ${
                  active
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink-muted hover:border-zari-700 hover:text-ink'
                }`}
              >
                {item.title}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


