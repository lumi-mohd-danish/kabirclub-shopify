// next
import Image from 'next/image';

/**
 * The campaign band. It used to be a full-bleed parallax photograph with a
 * `bg-black/50` glass card floating on top of it — a card that could never
 * guarantee legibility because it had no idea what frame was behind it.
 *
 * It is now an ink band with the photograph as a plate BESIDE the type, which
 * is the same move the hero makes, mirrored: film left, words right. That also
 * retires `react-scroll-parallax`, whose scroll-driven transform was the one
 * piece of motion on the page that could not be reduced-motion gated.
 */
const Promotions = () => {
  return (
    <section className="section-band grain">
      <div className="container-page grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Photograph */}
        <div className="flex flex-col lg:order-first lg:col-span-7">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-plate border border-zari-500/25 lg:aspect-[4/3]">
            {/*
              Two crops, one plate: the portrait file for phones and the
              landscape one from `sm` up. Only ever one of them is displayed,
              so only one is in the accessibility tree.
            */}
            <Image
              src="/images/promotions/winter.jpg"
              alt="Winter collection"
              fill
              sizes="100vw"
              className="object-cover sm:hidden"
              priority
            />
            <Image
              src="/images/promotions/winter-1.jpg"
              alt="Winter collection"
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="hidden object-cover sm:block"
              priority
            />
          </div>
          <div className="rule-zari" aria-hidden="true" />
        </div>

        {/* Editorial column */}
        <div className="flex flex-col items-start gap-5 lg:col-span-5">
          <p className="eyebrow text-zari-500">Featured</p>
          <div className="rule-zari w-16" aria-hidden="true" />

          <h2 className="font-display text-display-2 text-paper">
            Summer Elegance
            <br />
            Golden Style
          </h2>

          <p className="max-w-[46ch] text-lead text-paper-muted">
            Experience luxury with our premium summer collection.
          </p>

          <a className="btn-primary mt-2" href="/search?category=topwear">
            View Collection
          </a>

          <div className="mt-2 flex flex-col items-start gap-3">
            <a
              href="https://www.instagram.com/kabirclub50"
              target="_blank"
              rel="noopener noreferrer"
              className="thread-link-ink inline-flex items-center gap-2 text-body-sm text-paper-muted hover:text-paper"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              <span>Follow us @kabirclub50</span>
            </a>

            <a
              href="https://wa.me/917991812899"
              target="_blank"
              rel="noopener noreferrer"
              className="thread-link-ink inline-flex items-center gap-2 text-body-sm text-paper-muted hover:text-paper"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
              >
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
              </svg>
              <span>Chat with us on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Promotions;
