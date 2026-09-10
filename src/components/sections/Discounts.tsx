/**
 * The shipping-threshold strip that sits between the hero band and the
 * catalogue. It used to be an infinite `react-fast-marquee` loop, which moved
 * a single sentence past the reader forever and could never be read at rest.
 * It is now a static ink strip banded top and bottom by the woven zari rule —
 * the same device that edges the hero film.
 */
const Discounts = () => {
  return (
    <div className="bg-ink-900">
      <div className="rule-zari" aria-hidden="true" />
      <div className="container-page py-3">
        <p className="eyebrow text-center text-zari-500">
          Free shipping on all orders above <span className="num">&#8377;1,000</span>
        </p>
      </div>
      <div className="rule-zari" aria-hidden="true" />
    </div>
  );
};

export default Discounts;
