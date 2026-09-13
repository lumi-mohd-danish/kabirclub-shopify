/**
 * The store's only INR / tax / product-accuracy disclosure. It existed as a
 * file but was never rendered anywhere — `grep -rn Disclaimer src/` matched
 * only its own declaration — so the disclosure legally shipped nowhere. It is
 * now mounted in <Footer />, which puts it on every route.
 *
 * "Terms and Conditions" and "Privacy Policy" are deliberately plain text, not
 * links. Phase 0 de-linked them because neither route exists under src/app and
 * legal copy must not be invented to fill one. They are emphasised in `paper`
 * rather than in gold so they read as named documents rather than as links
 * that are broken.
 */
const Disclaimer = () => {
  return (
    <section
      aria-labelledby="footer-disclaimer"
      className="mt-12 border-t border-ink-700 pt-10 md:mt-16"
    >
      <h3 id="footer-disclaimer" className="eyebrow text-zari-500">
        Disclaimer
      </h3>

      <div className="mt-5 flex max-w-[62ch] flex-col gap-4 text-body text-paper-muted">
        <p>
          All product prices displayed on our website are in Indian Rupees (INR) and are inclusive
          of all taxes. Prices are subject to change without prior notice.
        </p>
        <p>
          While we strive to provide accurate product information, images displayed may vary
          slightly from the actual product. Colors may appear differently based on your device
          display settings.
        </p>
        {/* The one accent hairline in this block: 1px of zari at 35%, the
            system's accent border. The original was a 2px solid #daa520 bar,
            and 2px borders are out everywhere except the selected size chip. */}
        <p className="border-l border-zari-500/35 pl-4">
          By using our services, you agree to our{' '}
          <span className="font-medium text-paper">Terms and Conditions</span> and{' '}
          <span className="font-medium text-paper">Privacy Policy</span>.
        </p>
      </div>
    </section>
  );
};

export default Disclaimer;
