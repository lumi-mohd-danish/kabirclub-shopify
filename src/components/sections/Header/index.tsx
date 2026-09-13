import Cart from '@/components/cart';
import { getCollections } from '@/lib/supabase/api';
import Image from 'next/image';
import Link from 'next/link';

import Menu, { type NavItem } from './Menu';
import MobileMenu from './mobile-menu';
import SearchIcon from './SearchIcon';
import UserProfile from './UserProfile';

/** Newest first — the same destination the hero's primary action uses. */
const NEW_IN_HREF = '/search?sort=created_at-desc';

/**
 * Navigation comes from the collections that actually exist, so an item can
 * never lead to a `notFound()`. With no Supabase credentials `getCollections()`
 * serves the sample set (Topwear, Bottomwear) and the nav shrinks to match; it
 * returns `[]` rather than throwing on a query failure, in which case Shop is
 * still a working link to the full catalogue.
 */
async function buildNavigation(): Promise<NavItem[]> {
  const collections = await getCollections();

  return [
    {
      title: 'Shop',
      href: '/search',
      items: [
        { title: 'All products', href: '/search' },
        ...collections.map((collection) => ({
          title: collection.title,
          href: `/search/${encodeURIComponent(collection.handle)}`
        }))
      ]
    },
    { title: 'New in', href: NEW_IN_HREF },
    { title: 'About', href: '/about-us' },
    { title: 'Contact', href: '/contact' }
  ];
}

/**
 * The chrome band.
 *
 * This is a server component. Only the two pieces that genuinely depend on the
 * visitor — <Cart /> and <UserProfile /> — plus the three interactive nav
 * pieces are client components, so the navigation, the wordmark and the band
 * itself are in the server HTML of every route. The header used to be a client
 * component gated on `useAuth().isLoading`, which meant every page shipped a
 * grey pulse where its chrome should be and carried two copies of the same
 * logo markup.
 *
 * Ink-900 ground, `h-16 lg:h-20` (down from 112px), one hairline at the
 * bottom. `relative` is load-bearing: it is the containing block for the two
 * panels that drop to `top-full` (search and the mobile menu), and the `z-30`
 * keeps them over the page while staying under the cart drawer's `z-50`. The
 * band does not stick — the design brief does not ask for it, and the hero's
 * `calc(100svh - 80px)` works out the same either way.
 */
export default async function Header() {
  const navigation = await buildNavigation();

  return (
    <header className="relative z-30 border-b border-ink-700 bg-ink-900 text-paper">
      <div className="container-page flex h-16 items-center gap-4 lg:h-20 lg:gap-10">
        {/*
          The brand wordmark, not the page title: the sr-only <h1>KabirClub</h1>
          that used to live here made every page's first heading the shop name.
          The homepage h1 belongs to the hero.
        */}
        <Link href="/" aria-label="KabirClub — home" className="flex shrink-0 items-center">
          <Image
            alt=""
            src="/images/logo2.png"
            width={150}
            height={52}
            className="h-7 w-auto lg:h-8"
            priority
          />
        </Link>

        <Menu items={navigation} />

        <div className="ml-auto flex items-center gap-2 lg:gap-4">
          <SearchIcon />
          <Cart />
          <UserProfile />
          <MobileMenu items={navigation} />
        </div>
      </div>
    </header>
  );
}
