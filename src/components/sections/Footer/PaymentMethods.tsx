/**
 * What checkout can actually take.
 *
 * This component used to render five logos from src/data/payment-methods.json
 * — VISA, MasterCard, PayPal, Apple Pay, Google Pay — none of which this store
 * accepts: src/app/checkout/page.tsx declares
 * `type PaymentMethod = 'cash_on_delivery' | 'upi'` and offers exactly those
 * two radio options. It was never mounted, which is the only reason five false
 * payment claims were not already live on the site.
 *
 * It is mounted now, stating the two real methods as text. The JSON file and
 * the five PNGs under public/images/footer/payment-methods/ are left in place
 * (they are outside this area) but are now unreferenced.
 */
const PaymentMethods = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 md:justify-end">
      <span className="eyebrow text-paper-muted">We accept</span>
      <span className="text-body-sm text-paper">Cash on Delivery &middot; UPI</span>
    </div>
  );
};

export default PaymentMethods;
