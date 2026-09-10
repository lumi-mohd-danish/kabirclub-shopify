// react
import { ReactNode } from 'react';

// components
import Categories from './Categories';
import CopyRight from './CopyRight';
import Disclaimer from './Disclaimer';
import PaymentMethods from './PaymentMethods';
import SocialMedia from './SocialMedia';

/**
 * One footer column: an eyebrow heading over a block of content.
 *
 * Replaces three hand-rolled copies of the same markup, each of which carried
 * its own font-size ladder (`text-[20px]` / `text-lg sm:text-xl md:text-[20px]`)
 * and its own gold pill ornament. The heading is the site-wide eyebrow device —
 * 11px / 0.18em / 600 / uppercase — in zari-500, which is the gold the cardinal
 * rule permits on an ink ground (8.53:1 on ink-900).
 */
const FooterColumn = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col items-center gap-5 text-center md:items-start md:text-left">
    <h3 className="eyebrow text-zari-500">{title}</h3>
    {children}
  </div>
);

/** One contact line: a decorative glyph plus its text. */
const ContactRow = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
  <li className="flex items-start justify-center gap-3 md:justify-start">
    <span className="mt-0.5 shrink-0 text-paper-muted" aria-hidden="true">
      {icon}
    </span>
    <span className="text-body text-paper-muted">{children}</span>
  </li>
);

const Footer = () => {
  return (
    // The footer is one of the design's ink bands, so it carries the film
    // grain (3.5% inline feTurbulence, clipped to this element by `.grain`'s
    // own `isolation: isolate`) rather than reading as a flat black slab.
    <footer className="grain w-full bg-ink-900 text-paper">
      <h2 className="sr-only">Footer</h2>

      {/* Ornament 1 of 5, retokened: the 4px `from-[#daa520] via-[#f5d76e]`
          gradient bar becomes the woven zari rule — a 1px stitched thread.
          Ornaments 2, 3 and 4 (the three `bg-[#daa520]/40` pills that hung off
          the left edge of each column) are deleted outright. */}
      <div className="rule-zari" />

      <div className="container-page py-16 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-8 lg:grid-cols-3">
          <FooterColumn title="Navigation">
            <Categories />
          </FooterColumn>

          <FooterColumn title="Follow us">
            <SocialMedia />
          </FooterColumn>

          <div className="md:col-span-2 lg:col-span-1">
            <FooterColumn title="Contact us">
              <ul className="flex flex-col gap-3">
                <ContactRow
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  {/* Was inert text. `.num` keeps the digits tabular. */}
                  <a
                    href="tel:+917991812899"
                    className="thread-link-ink num text-paper-muted hover:text-paper"
                  >
                    +91 79918 12899
                  </a>
                </ContactRow>

                <ContactRow
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                      <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                    </svg>
                  }
                >
                  <a
                    href="mailto:kabirclub50@gmail.com"
                    className="thread-link-ink break-words text-paper-muted hover:text-paper"
                  >
                    kabirclub50@gmail.com
                  </a>
                </ContactRow>

                <ContactRow
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                >
                  {/* Left as plain text: there is no street address on record,
                      so there is nothing honest to point a map link at. */}
                  Kabirclub, India
                </ContactRow>
              </ul>
            </FooterColumn>
          </div>
        </div>

        <Disclaimer />

        {/* Ornament 5 of 5, retokened: the `via-[#daa520]/30` fade-out
            hairline becomes the system's 1px rule on ink. */}
        <div className="mt-10 flex flex-col items-center gap-4 border-t border-ink-700 pt-8 md:flex-row md:justify-between">
          <CopyRight />
          <PaymentMethods />
        </div>
      </div>
    </footer>
  );
};

export default Footer;
