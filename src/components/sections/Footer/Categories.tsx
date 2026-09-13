// next
import Link from 'next/link';

// data
import { getCollections } from '@/lib/supabase/api';

/**
 * The footer navigation column.
 *
 * It used to be an empty <h3>Navigation</h3> with the whole link list
 * commented out, mapping over a `menu` variable that does not exist in this
 * repo — so the column rendered a heading and nothing else.
 *
 * The destinations are the header's, deliberately: same collections, same
 * hrefs, same labels (`buildNavigation()` in
 * src/components/sections/Header/index.tsx). The categories are read from
 * `getCollections()` rather than hardcoded for the same reason the header
 * reads them — `/search/[collection]` calls `notFound()` for a handle that
 * does not exist, so a hardcoded "Topwear" becomes a 404 on any real store
 * that never created that collection. With no Supabase credentials the call
 * serves the sample set and the column shrinks to match; on a query failure it
 * returns `[]` and the remaining links still work.
 *
 * The non-collection destinations are all mounted routes: /search
 * (search/page.tsx, which also owns the `?sort=` contract), /about-us and
 * /contact.
 */
const Categories = async () => {
  const collections = await getCollections();

  const links = [
    { title: 'All products', href: '/search' },
    ...collections.map((collection) => ({
      title: collection.title,
      href: `/search/${encodeURIComponent(collection.handle)}`
    })),
    { title: 'New in', href: '/search?sort=created_at-desc' },
    { title: 'About', href: '/about-us' },
    { title: 'Contact', href: '/contact' }
  ];

  return (
    // A second navigation landmark, so a screen-reader user can jump straight
    // to the footer links. The visible <h3> is supplied by <FooterColumn>.
    <nav aria-label="Footer">
      <ul className="flex flex-col items-center gap-3 md:items-start">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="thread-link-ink text-body text-paper-muted hover:text-paper"
            >
              {link.title}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Categories;
