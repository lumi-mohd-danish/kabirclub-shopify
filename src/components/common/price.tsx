import clsx from 'clsx';

/**
 * Money, rendered the way an Indian storefront renders it.
 *
 * - The locale is pinned to `en-IN` rather than left as `undefined`. The old
 *   value took the visitor's locale, so the same cart printed `₹1,999` in Delhi
 *   and `₹1,999.00` (or `1.999,00 ₹`) elsewhere — and it was the reason this
 *   component needed `suppressHydrationWarning` at all.
 * - `narrowSymbol` keeps it `₹` instead of `INR ` in front of the figure.
 * - The ISO code moves to `sr-only`, so the visible line ends at the number
 *   instead of reading "₹999.00 INR". Screen readers still get the currency.
 *
 * Fraction digits are elastic (0-2) rather than pinned to 0. Whole-rupee
 * amounts lose their ".00" — which is the whole point of the change — but a
 * GST line of ₹2,358.82 still prints the paise it is actually charged at.
 * Pinning to 0 would have made the drawer, the checkout summary and the
 * persisted order quote a number nobody is billed, which is the parity Phase 0
 * fixed.
 *
 * Colour and size belong to the call site, which knows its surface: prices on
 * paper are `text-zari-700`, prices on ink are `text-zari-500`/`text-zari-300`.
 * Every call site also passes `.num` so figures are tabular.
 */
const Price = ({
  amount,
  className,
  currencyCode = 'INR',
  currencyCodeClassName
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
} & React.ComponentProps<'p'>) => (
  <p suppressHydrationWarning={true} className={className}>
    {`${new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(parseFloat(amount))}`}
    <span className={clsx('sr-only', currencyCodeClassName)}>{` ${currencyCode}`}</span>
  </p>
);

export default Price;
