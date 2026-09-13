/**
 * The closing editorial band. Everything that used to decorate it — a gold
 * gradient bar, two `bg-[#daa520]/5 blur-3xl` glows, a pair of oversized
 * quote glyphs at 20% opacity and a `bg-black/60 backdrop-blur-sm` card laid
 * over a `bg-black` section — has been removed. None of it was perceptible
 * against the ground it sat on; all of it cost paint. The band's own ink
 * ground and the woven zari rule do the work now.
 */
const AboutUs = () => {
  return (
    <section className="section-band grain">
      <div className="container-page flex flex-col items-center gap-6 text-center">
        <p className="eyebrow text-zari-500">About us</p>
        <div className="rule-zari w-16" aria-hidden="true" />

        <h2 className="max-w-[24ch] font-display text-display-2 text-paper">
          Premium Men&apos;s Fashion Destination
        </h2>

        <p className="max-w-[62ch] text-lead text-paper-muted">
          At Kabirclub, we offer a handpicked collection of high-quality men&apos;s clothing &mdash;
          from stylish t-shirts and shirts to perfectly fitted jeans. Every piece is crafted with
          attention to detail, ensuring both comfort and style for the modern man.
        </p>

        <a href="/about-us" className="thread-link-ink mt-2 text-body text-zari-500">
          Discover Our Story
        </a>
      </div>
    </section>
  );
};

export default AboutUs;
