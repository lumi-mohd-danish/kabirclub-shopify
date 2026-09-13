import clsx from 'clsx';

/**
 * Money, and the only place in the app that formats it.
 *
 * - The locale is pinned to `en-IN` rather than left as `undefined`. The old
 *   value took the visitor's locale, so the same cart printed `₹1,999` in Delhi
 *   and `₹1,999.00` (or `1.999,00 ₹`) elsewhere.
 * - `narrowSymbol` keeps it `₹` instead of `INR ` in front of the figure.
 * - The ISO code moves to `sr-only`, so the visible line ends at the number
 *   instead of reading "₹999.00 INR". Screen readers still get the currency.
 * - `.num` is applied HERE, not left to the call site. Tabular figures are a
 *   property of money, not of the surface it sits on, and half the call sites
 *   used to forget it.
 *
 * Colour and size still belong to the call site, which knows its surface:
 * prices on paper are `text-zari-700`, prices on ink are
 * `text-zari-500`/`text-zari-300`.
 */

/**
 * Catalogue money is whole rupees, so `maximumFractionDigits` is 0 and a plate
 * prints `₹1,999`, never `₹1,999.00`.
 *
 * An amount that actually carries paise widens to 2 on its own. That is not a
 * hedge: GST is 18% of a subtotal, so the tax row is `₹2,358.82` far more often
 * than not, and rounding it for display would leave the printed rows no longer
 * summing to the printed total — a number nobody is billed. A call site that
 * wants to force the issue either way passes `maximumFractionDigits` itself.
 */
const wholeRupeeDigits = (value: number): number => (Number.isInteger(value) ? 0 : 2);

/** Intl throws on a malformed currency code, and a thrown formatter is a blank page. */
const safeCurrencyCode = (code: string): string =>
  /^[A-Za-z]{3}$/.test(code) ? code.toUpperCase() : 'INR';

const Price = ({
  amount,
  className,
  currencyCode = 'INR',
  currencyCodeClassName,
  maximumFractionDigits,
  ...rest
}: {
  /** A number, or the string form of one. Anything unparseable renders as zero. */
  amount: string | number;
  className?: string;
  currencyCode?: string;
  currencyCodeClassName?: string;
  /** Override the digit rule. Omit it unless the amount is neither a price nor a tax line. */
  maximumFractionDigits?: number;
} & Omit<React.ComponentProps<'p'>, 'children'>) => {
  const parsed = typeof amount === 'number' ? amount : Number.parseFloat(amount);
  const value = Number.isFinite(parsed) ? parsed : 0;
  const code = safeCurrencyCode(currencyCode);
  const fractionDigits = maximumFractionDigits ?? wholeRupeeDigits(value);

  return (
    <p {...rest} suppressHydrationWarning={true} className={clsx('num', className)}>
      {new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: fractionDigits
      }).format(value)}
      <span className={clsx('sr-only', currencyCodeClassName)}>{` ${code}`}</span>
    </p>
  );
};

export default Price;
