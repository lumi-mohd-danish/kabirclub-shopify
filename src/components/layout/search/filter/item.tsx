'use client';

import { SortFilterItem } from '@/lib/constants';
import { createUrl } from '@/lib/utils';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import type { ListItem, PathFilterItem } from '.';

function PathFilterItem({ item }: { item: PathFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = pathname === item.path;
  const newParams = new URLSearchParams(searchParams.toString());
  const DynamicTag = active ? 'p' : Link;

  newParams.delete('q');

  return (
    <li className="flex" key={item.title}>
      <DynamicTag
        href={createUrl(item.path, newParams)}
        className={clsx('thread-link w-full text-ink', {
          // The active entry renders as a <p>, so it has no hover thread to
          // draw. A static underline plus the metal is what marks it.
          'text-zari-700 underline underline-offset-4': active
        })}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

function SortFilterItem({ item }: { item: SortFilterItem }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get('sort') === item.slug;
  const q = searchParams.get('q');
  const href = createUrl(
    pathname,
    new URLSearchParams({
      ...(q && { q }),
      ...(item.slug && item.slug.length && { sort: item.slug })
    })
  );
  const DynamicTag = active ? 'p' : Link;

  return (
    <li className="flex" key={item.title}>
      <DynamicTag
        prefetch={!active ? false : undefined}
        href={href}
        className={clsx('thread-link w-full text-ink', {
          // The active entry renders as a <p>, so it has no hover thread to
          // draw. A static underline plus the metal is what marks it.
          'text-zari-700 underline underline-offset-4': active
        })}
      >
        {item.title}
      </DynamicTag>
    </li>
  );
}

export function FilterItem({ item }: { item: ListItem }) {
  return 'path' in item ? <PathFilterItem item={item} /> : <SortFilterItem item={item} />;
}
