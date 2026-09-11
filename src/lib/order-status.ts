/**
 * Order + payment status chips — the single source of truth.
 *
 * /profile and /orders had each grown their own status -> colour map and the
 * two DISAGREED on three of the five order statuses, so one order rendered a
 * different state colour depending on which page you opened it from:
 *
 *   status      /profile (was)            /orders (was)              now
 *   ---------   -----------------------   ------------------------   ---------
 *   pending     fell through to default   bg-haldi text-ink          haldi
 *   confirmed   bg-haldi text-ink         paper-sunk outline         ink-900
 *   shipped     bg-ink-900 text-paper     bg-ink-900 text-paper      ink-900
 *   delivered   bg-neem text-paper        bg-neem text-paper         neem
 *   cancelled   fell through to default   bg-madder text-paper       madder
 *
 * The palette carries four state buckets and Ink & Zari has no blue or purple,
 * so the informational states read as strong neutral ink rather than as an
 * off-system hue:
 *
 *   haldi    awaiting action  — someone still has to do something
 *   ink-900  neutral / in flight — accepted, moving, nothing to action
 *   neem     success / delivered / paid
 *   madder   cancelled / failed
 *
 * `confirmed` and `shipped` therefore share the ink-900 chip on purpose. The
 * colour carries the state CLASS; the chip's own label ("Confirmed" /
 * "Shipped") carries the precise step. Giving `confirmed` its own hue would
 * mean either re-using haldi (wrong — nobody is waiting on an action once an
 * order is confirmed) or minting a fifth treatment outside the four buckets.
 *
 * Contrast, all against the chip's own fill:
 *   haldi   #B4842B + ink    5.31:1
 *   ink-900 #171310 + paper 15.90:1
 *   neem    #2F5D45 + paper  6.75:1
 *   madder  #9A3324 + paper  6.40:1
 * All clear 4.5:1, which matters because a chip is `.eyebrow` (11px) and so
 * gets no large-text exemption.
 *
 * GROUND: these chips are opaque fills designed to sit on paper / paper-raised
 * plates, which is where both call sites render them. The unknown-status
 * fallback is the only translucent one and also assumes a paper ground.
 */

/** The order lifecycle, mirroring `Order['orderStatus']` in supabase/types. */
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/** The payment lifecycle, mirroring `Order['paymentStatus']`. */
export type PaymentStatus = 'pending' | 'paid' | 'failed';

/**
 * Shared chip geometry: `.eyebrow` type on a 3px control radius. Chips are
 * controls, not plates, so they take `rounded-control` rather than
 * `rounded-plate`. This also settles the px-2.5 py-1 / py-1.5 split the two
 * pages had drifted into.
 */
const CHIP_BASE = 'eyebrow inline-block rounded-control px-2.5 py-1.5';

/**
 * Unknown / absent status. Supabase hands back a raw string, so a value
 * outside the union is reachable at runtime even though the type says
 * otherwise. A quiet outline chip states "we do not recognise this" without
 * claiming a state colour. `ink-muted` is 5.61:1 on paper — `ink-faint` would
 * be 3.66:1 and fails at 11px.
 */
const CHIP_UNKNOWN = 'border border-line-strong bg-paper text-ink-muted';

const ORDER_STATUS_CHIPS: Record<OrderStatus, string> = {
  pending: 'bg-haldi text-ink',
  confirmed: 'bg-ink-900 text-paper',
  shipped: 'bg-ink-900 text-paper',
  delivered: 'bg-neem text-paper',
  cancelled: 'bg-madder text-paper'
};

const PAYMENT_STATUS_CHIPS: Record<PaymentStatus, string> = {
  pending: 'bg-haldi text-ink',
  paid: 'bg-neem text-paper',
  failed: 'bg-madder text-paper'
};

/**
 * Normalise whatever the API actually handed us. Trims and lower-cases so a
 * 'Delivered' or ' shipped ' out of the database still resolves, and collapses
 * null / undefined to '' so the lookup simply misses and returns the fallback.
 */
const normalise = (status: string | null | undefined): string =>
  typeof status === 'string' ? status.trim().toLowerCase() : '';

/**
 * Complete chip class string for an order status. Call sites stay declarative:
 *
 *   <span className={orderStatusChipClass(order.orderStatus)}>
 *     {formatStatusLabel(order.orderStatus)}
 *   </span>
 *
 * The return value already carries `.eyebrow`, the radius and the padding, so
 * nothing needs to be prepended. Layout utilities (`mt-2`, `w-full`) can be
 * appended freely — they do not collide with anything emitted here.
 */
export function orderStatusChipClass(status: string | null | undefined): string {
  const state = ORDER_STATUS_CHIPS[normalise(status) as OrderStatus] ?? CHIP_UNKNOWN;
  return `${CHIP_BASE} ${state}`;
}

/**
 * Complete chip class string for a payment status. Same contract as
 * `orderStatusChipClass`.
 */
export function paymentStatusChipClass(status: string | null | undefined): string {
  const state = PAYMENT_STATUS_CHIPS[normalise(status) as PaymentStatus] ?? CHIP_UNKNOWN;
  return `${CHIP_BASE} ${state}`;
}

/**
 * Sentence-case a raw status for display. Both pages had hand-rolled
 * `s.charAt(0).toUpperCase() + s.slice(1)`, which throws nothing but renders
 * an empty chip for a null status; this returns a readable placeholder
 * instead, and underscores become spaces so 'out_for_delivery' reads properly
 * if the backend ever adds one.
 */
export function formatStatusLabel(status: string | null | undefined): string {
  const value = normalise(status).replace(/_/g, ' ');
  if (!value) return 'Unknown';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
