'use client';

import {
  GST_RATE,
  computeCartCost,
  type CartLineWithSize,
  type CartWithSizes,
  type PlacedOrderRow
} from '@/lib/supabase/api';
import { getCartForSession, getCartSessionId, placeOrderAction } from '@/components/cart/actions';
import SectionHeading from '@/components/common/SectionHeading';
import type { ShippingAddress } from '@/lib/supabase/types';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode
} from 'react';

// Force dynamic rendering to avoid localStorage issues
export const dynamic = 'force-dynamic';

/** The store's collection UPI handle. Declared once so the QR panel, the
 *  confirmation copy and the persisted order can never disagree. */
const STORE_UPI_ID = 'danish-icici@ybl';

type CheckoutStep = 'address' | 'payment' | 'confirmation';
type PaymentMethod = 'cash_on_delivery' | 'upi';
type AddressField = keyof ShippingAddress;

type AddressErrors = Partial<Record<AddressField, string>>;

const CHECKOUT_STEPS: { id: CheckoutStep; label: string }[] = [
  { id: 'address', label: 'Shipping address' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' }
];

/** Field order drives both the tab order and which field gets focus on submit. */
const ADDRESS_FIELD_ORDER: AddressField[] = [
  'fullName',
  'phone',
  'addressLine1',
  'addressLine2',
  'city',
  'state',
  'postalCode',
  'country'
];

const ADDRESS_FIELD_LABELS: Record<AddressField, string> = {
  fullName: 'Full name',
  phone: 'Phone',
  addressLine1: 'Address line 1',
  addressLine2: 'Address line 2',
  city: 'City',
  state: 'State',
  postalCode: 'PIN code',
  country: 'Country'
};

const REQUIRED_ADDRESS_FIELDS: AddressField[] = [
  'fullName',
  'phone',
  'addressLine1',
  'city',
  'state',
  'postalCode',
  'country'
];

const EMPTY_ADDRESS: ShippingAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India'
};

/**
 * Read the checkout session id.
 *
 * The cookie is httpOnly (minted server-side by the `addItem` cart action), so
 * it is deliberately invisible to `document.cookie`. The only way to read it
 * from the browser is the `getCartSessionId` server action, and it is used here
 * for exactly one thing: telling a shopper whose session has lapsed why their
 * order cannot be placed. The order itself goes through `placeOrderAction`,
 * which reads the cookie again on the server and trusts nothing sent from here.
 */
const getSessionId = (): Promise<string | null> => getCartSessionId();

/** Indian mobile numbers: 10 digits starting 6-9, with an optional +91 / 0 prefix. */
const isValidIndianPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, '');
  const national =
    digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits.length === 11 && digits.startsWith('0')
        ? digits.slice(1)
        : digits;

  return /^[6-9]\d{9}$/.test(national);
};

/** Indian PIN codes are exactly six digits and never start with 0. */
const isValidPincode = (value: string): boolean => /^[1-9]\d{5}$/.test(value);

const validateAddressField = (
  field: AddressField,
  rawValue: string | undefined
): string | undefined => {
  const value = (rawValue ?? '').trim();

  if (!value) {
    return REQUIRED_ADDRESS_FIELDS.includes(field)
      ? `${ADDRESS_FIELD_LABELS[field]} is required`
      : undefined;
  }

  switch (field) {
    case 'fullName':
      return value.length < 2 ? 'Enter your full name' : undefined;
    case 'phone':
      return isValidIndianPhone(value) ? undefined : 'Enter a valid 10-digit Indian mobile number';
    case 'postalCode':
      return isValidPincode(value) ? undefined : 'Enter a valid 6-digit PIN code';
    case 'addressLine1':
      return value.length < 5 ? 'Enter your house / flat number and street' : undefined;
    default:
      return undefined;
  }
};

const validateAddress = (address: ShippingAddress): AddressErrors => {
  const errors: AddressErrors = {};

  for (const field of ADDRESS_FIELD_ORDER) {
    const message = validateAddressField(field, address[field]);
    if (message) {
      errors[field] = message;
    }
  }

  return errors;
};

/** Trim every value before it is persisted, and drop an empty address line 2. */
const normaliseAddress = (address: ShippingAddress): ShippingAddress => ({
  fullName: address.fullName.trim(),
  phone: address.phone.trim(),
  addressLine1: address.addressLine1.trim(),
  addressLine2: address.addressLine2?.trim() ? address.addressLine2.trim() : undefined,
  city: address.city.trim(),
  state: address.state.trim(),
  postalCode: address.postalCode.trim(),
  country: address.country.trim() || 'India'
});

/** The size the shopper actually picked, falling back to the line's options. */
const getLineSize = (line: CartLineWithSize): string | undefined => {
  const direct = typeof line.size === 'string' ? line.size.trim() : '';
  if (direct) return direct;

  const option = line.merchandise?.selectedOptions?.find(
    (entry) => entry.name.toLowerCase() === 'size' && entry.value.trim().length > 0
  );

  return option?.value.trim();
};

/** A line is only usable if it can be priced — an unpriced line must not be charged for. */
const isUsableLine = (line: CartLineWithSize | undefined): line is CartLineWithSize =>
  Boolean(line?.merchandise?.product?.id) &&
  Number.isFinite(Number(line?.merchandise?.product?.price));

const gstLabel = `GST (${Math.round(GST_RATE * 100)}%)`;

/**
 * The quotable order number: the first eight characters of the order's uuid,
 * uppercased. `/orders` derives its heading the same way, so the shopper is
 * never given two different names for one order.
 */
const orderNumber = (id: string | null | undefined): string => (id ?? '').slice(0, 8).toUpperCase();

/** en-IN, like every figure on this page — never the visitor's own locale. */
const orderDateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

const formatOrderDate = (value: string | null | undefined): string => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? orderDateFormatter.format(date) : '—';
};

/**
 * State iconography, not decoration. The confirmation step used a ✅ emoji at
 * `text-6xl` — a size that is not on the type scale, and a glyph whose colour
 * and weight the system cannot control. This is the same badge the root error
 * boundary uses (src/app/error.tsx): a pill-cut hairline over the sunk mat,
 * holding a 1.5px stroked glyph that takes its colour from the state token.
 */
function CheckIcon({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4.5 12.6 5.1 5.1L19.5 6.6" />
    </svg>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartWithSizes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<AddressErrors>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrderRow | null>(null);

  const addressFieldRefs = useRef<Partial<Record<AddressField, HTMLInputElement | null>>>({});
  const paymentConfirmRef = useRef<HTMLInputElement | null>(null);

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      // One round trip, and the session id never leaves the server: the action
      // reads the httpOnly cookie and answers with that session's own cart.
      setCart(await getCartForSession());
    } catch {
      setCart(null);
      setLoadError('We could not load your cart. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  /** Only lines we can price are shown — and exactly those lines are ordered. */
  const cartLines = useMemo<CartLineWithSize[]>(
    () => (Array.isArray(cart?.lines) ? cart!.lines.filter(isUsableLine) : []),
    [cart]
  );

  /**
   * One money calculation for the whole page. `computeCartCost` is the same
   * function `placeOrder` uses, so the total shown here is the total charged
   * and the total stored on the order — GST included.
   */
  const costBreakdown = useMemo(() => computeCartCost(cartLines), [cartLines]);

  /** Units, not lines — "2 items" has to mean two garments. */
  const itemCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.quantity, 0),
    [cartLines]
  );

  const handleInputChange = (field: AddressField, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }));

    // Clear an existing error as soon as the shopper fixes it; never introduce
    // a new error mid-typing.
    setAddressErrors((prev) => {
      if (!prev[field] || validateAddressField(field, value)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInputBlur = (field: AddressField) => {
    const message = validateAddressField(field, shippingAddress[field]);

    setAddressErrors((prev) => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleAddressSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateAddress(shippingAddress);
    setAddressErrors(errors);

    const firstInvalid = ADDRESS_FIELD_ORDER.find((field) => errors[field]);
    if (firstInvalid) {
      addressFieldRefs.current[firstInvalid]?.focus();
      return;
    }

    setShippingAddress(normaliseAddress);
    setCurrentStep('payment');
  };

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPlacingOrder) return;

    setOrderError(null);

    if (paymentMethod === 'upi' && !paymentConfirmed) {
      setPaymentError('Please confirm that you have completed the UPI payment.');
      paymentConfirmRef.current?.focus();
      return;
    }

    setPaymentError(null);

    // Re-check the address: the shopper can come back and edit it.
    const errors = validateAddress(shippingAddress);
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      setCurrentStep('address');
      return;
    }

    const sessionId = await getSessionId();

    if (!sessionId) {
      setOrderError('Your checkout session has expired. Please add your items to the cart again.');
      return;
    }

    if (cartLines.length === 0) {
      setOrderError('Your cart is empty. Add an item before placing an order.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      // The server action owns the session: it re-reads the httpOnly cookie
      // itself, so the browser cannot check out against another shopper's cart.
      // It carries no money either — every unit price is re-read from the
      // products table, which is why no line total is sent.
      const order = await placeOrderAction({
        items: cartLines.map((line) => ({
          productId: line.merchandise.product.id,
          quantity: line.quantity,
          // The size the shopper actually chose, not a hardcoded 'M'.
          size: getLineSize(line),
          // So checkout clears only these lines, not the whole session — a
          // second tab's additions survive.
          cartLineId: line.id
        })),
        shippingAddress: normaliseAddress(shippingAddress),
        paymentMethod,
        upiId: paymentMethod === 'upi' ? STORE_UPI_ID : undefined
      });

      setPlacedOrder(order);
      setCurrentStep('confirmation');
      // The cart rows are deleted by `placeOrder`; tell the header to refresh.
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch {
      setOrderError('We could not place your order. Please check your details and try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderAddressField = ({
    field,
    type = 'text',
    autoComplete,
    inputMode,
    maxLength,
    wrapperClassName
  }: {
    field: AddressField;
    type?: string;
    autoComplete: string;
    inputMode?: 'text' | 'numeric';
    maxLength?: number;
    wrapperClassName?: string;
  }): ReactNode => {
    const inputId = `shipping-${field}`;
    const errorId = `${inputId}-error`;
    const error = addressErrors[field];
    const isRequired = REQUIRED_ADDRESS_FIELDS.includes(field);

    return (
      <div className={wrapperClassName} key={field}>
        <label htmlFor={inputId} className="mb-2 block text-body-sm font-medium text-ink">
          {ADDRESS_FIELD_LABELS[field]}
          {isRequired ? <span aria-hidden="true"> *</span> : null}
        </label>
        <input
          id={inputId}
          name={field}
          ref={(element) => {
            addressFieldRefs.current[field] = element;
          }}
          type={type}
          value={shippingAddress[field] ?? ''}
          onChange={(event) => handleInputChange(field, event.target.value)}
          onBlur={() => handleInputBlur(field)}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          required={isRequired}
          aria-required={isRequired}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`field ${
            error ? 'border-madder hover:border-madder focus:border-madder' : ''
          }`}
        />
        {error ? (
          <p id={errorId} role="alert" className="mt-2 text-body-sm text-madder">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page flex flex-col items-center">
          <div
            className="mb-5 h-16 w-16 animate-spin rounded-pill border-b-2 border-zari-700"
            aria-hidden="true"
          />
          <SectionHeading eyebrow="Checkout" title="Loading your cart" as="h1" align="center" />
        </div>
      </div>
    );
  }

  // The cart is emptied once the order is placed, so the confirmation step must
  // never be replaced by the empty-cart screen.
  if (currentStep !== 'confirmation' && (cartLines.length === 0 || costBreakdown.total <= 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="container-page text-center">
          <SectionHeading
            eyebrow="Checkout"
            title={loadError ? 'We could not load your cart' : 'Your cart is empty'}
            as="h1"
            align="center"
          />
          <p className="mx-auto mt-4 max-w-[46ch] text-body text-ink-muted">
            {loadError ?? 'Add some items to your cart to proceed with checkout'}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {loadError ? (
              <button onClick={fetchCart} className="btn-primary">
                Try Again
              </button>
            ) : null}
            <button onClick={() => router.push('/')} className="btn-secondary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStepIndex = CHECKOUT_STEPS.findIndex((step) => step.id === currentStep);

  const orderSummary = (
    // paper-raised, not paper-sunk: the Total below is `text-price` gold, and
    // text-price is clamp(18..22px) at weight 500, which WCAG counts as normal
    // text. zari-700 is 4.42:1 on paper-sunk (fails) and 5.25:1 on
    // paper-raised. paper-sunk is the image mat, never a panel carrying gold.
    <div className="rounded-plate border border-line bg-paper-raised p-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="eyebrow text-ink-muted">Order Summary</h2>
        <span className="num text-caption text-ink-muted">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      <ul className="mt-4 space-y-3 text-body text-ink">
        {cartLines.map((line) => {
          const size = getLineSize(line);

          return (
            <li key={line.id} className="flex justify-between gap-4">
              <span className="min-w-0">
                <span className="block">{line.merchandise.product.title}</span>
                <span className="num mt-0.5 block text-body-sm text-ink-muted">
                  {size ? `Size ${size} · ` : ''}Qty {line.quantity}
                </span>
              </span>
              <span className="num whitespace-nowrap">
                {formatPrice(computeCartCost([line]).subtotal)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Subtotal -> GST -> Shipping -> Total, the order money is read in,
          and the same order the drawer and the /orders receipt print. */}
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-body text-ink">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="num">{formatPrice(costBreakdown.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="num text-ink-muted">{gstLabel}</dt>
          <dd className="num">{formatPrice(costBreakdown.gst)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Shipping</dt>
          <dd className="num">
            {costBreakdown.shipping > 0 ? formatPrice(costBreakdown.shipping) : 'Free'}
          </dd>
        </div>
        <div className="rule-zari !mt-4" aria-hidden="true" />
        <div className="!mt-4 flex items-center justify-between gap-4">
          <dt className="font-medium">Total</dt>
          <dd className="num text-price text-zari-700">{formatPrice(costBreakdown.total)}</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* `.section` owns the vertical rhythm (64/96/128) and `.container-page`
          the one horizontal inset — no hand-rolled padding ladder, no fifth
          max-width competing with the four the primitive replaced. */}
      <div className="section container-page">
        {/* Header */}
        <div className="mb-10">
          <SectionHeading eyebrow="Your order" title="Checkout" as="h1" align="center" />

          {/*
            The step list is LABELLED. Three numbered discs with the names
            hidden in `sr-only` told a sighted shopper only that there were
            three of something; the name of the step they are on, and of the
            one after it, is the whole point of a progress list. Done steps
            take a check and an ink hairline, the current step the ink fill,
            the ones ahead the quiet hairline.
          */}
          <ol
            aria-label="Checkout progress"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
          >
            {CHECKOUT_STEPS.map((step, index) => {
              const isCurrent = index === currentStepIndex;
              const isDone = index < currentStepIndex;

              return (
                <li
                  key={step.id}
                  aria-current={isCurrent ? 'step' : undefined}
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className={`hidden h-px flex-1 sm:block ${
                        isDone || isCurrent ? 'bg-ink-faint' : 'bg-line-strong'
                      }`}
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={`num flex h-8 w-8 shrink-0 items-center justify-center rounded-pill text-body-sm ${
                      isCurrent
                        ? 'bg-ink-900 text-paper'
                        : isDone
                          ? 'border border-ink text-ink'
                          : 'border border-line-strong text-ink-muted'
                    }`}
                  >
                    {isDone ? <CheckIcon className="h-4 w-4" /> : index + 1}
                  </span>
                  <span
                    className={`truncate text-body-sm ${
                      isCurrent ? 'font-medium text-ink' : 'text-ink-muted'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">
                    {isDone ? '(completed)' : isCurrent ? '(current step)' : '(not started)'}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/*
          The purchase path is a two-column grid from `lg` up: the step the
          shopper is filling in on the left, the money on the right where it
          STAYS. `lg:self-start` is what makes `lg:sticky` work — a stretched
          grid item is already as tall as its row and has nothing to scroll
          within. Below `lg` the summary follows the form in source order,
          which is also the order it should be read in on a phone.
        */}
        {currentStep !== 'confirmation' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-10">
            <div className="min-w-0">
              {/* Step 1: Shipping Address */}
              {currentStep === 'address' && (
                <form
                  noValidate
                  onSubmit={handleAddressSubmit}
                  className="rounded-plate border border-line bg-paper-raised p-6 md:p-8"
                >
                  <SectionHeading eyebrow="Step 1 of 3" title="Shipping address" className="mb-6" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderAddressField({ field: 'fullName', autoComplete: 'name' })}
                    {renderAddressField({
                      field: 'phone',
                      type: 'tel',
                      autoComplete: 'tel',
                      inputMode: 'numeric',
                      maxLength: 15
                    })}
                    {renderAddressField({
                      field: 'addressLine1',
                      autoComplete: 'address-line1',
                      wrapperClassName: 'md:col-span-2'
                    })}
                    {renderAddressField({
                      field: 'addressLine2',
                      autoComplete: 'address-line2',
                      wrapperClassName: 'md:col-span-2'
                    })}
                    {renderAddressField({ field: 'city', autoComplete: 'address-level2' })}
                    {renderAddressField({ field: 'state', autoComplete: 'address-level1' })}
                    {renderAddressField({
                      field: 'postalCode',
                      autoComplete: 'postal-code',
                      inputMode: 'numeric',
                      maxLength: 6
                    })}
                    {renderAddressField({ field: 'country', autoComplete: 'country-name' })}
                  </div>
                  <div className="mt-8">
                    <button type="submit" className="btn-cart">
                      Continue to Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 'payment' && (
                <form
                  noValidate
                  onSubmit={handlePlaceOrder}
                  className="rounded-plate border border-line bg-paper-raised p-6 md:p-8"
                >
                  <SectionHeading eyebrow="Step 2 of 3" title="Payment method" className="mb-6" />

                  <fieldset className="mb-6 space-y-4">
                    <legend className="sr-only">Choose how you want to pay</legend>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="cod"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={paymentMethod === 'cash_on_delivery'}
                        onChange={() => {
                          setPaymentMethod('cash_on_delivery');
                          setPaymentError(null);
                        }}
                        className="h-4 w-4 shrink-0 accent-ink"
                      />
                      <label htmlFor="cod" className="text-body text-ink">
                        Cash on Delivery
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="upi"
                        name="paymentMethod"
                        value="upi"
                        checked={paymentMethod === 'upi'}
                        onChange={() => {
                          setPaymentMethod('upi');
                          setPaymentError(null);
                        }}
                        className="h-4 w-4 shrink-0 accent-ink"
                      />
                      <label htmlFor="upi" className="text-body text-ink">
                        UPI Payment
                      </label>
                    </div>
                  </fieldset>

                  {paymentMethod === 'upi' && (
                    <div className="mb-6">
                      <label
                        htmlFor="store-upi-id"
                        className="mb-2 block text-body-sm font-medium text-ink"
                      >
                        UPI ID
                      </label>
                      <input
                        id="store-upi-id"
                        type="text"
                        value={STORE_UPI_ID}
                        readOnly
                        className="field num bg-paper-sunk tracking-wide"
                      />
                      <p className="mt-2 text-body-sm text-ink-muted">
                        This is our registered UPI ID for payments
                      </p>

                      {/* UPI payment instructions */}
                      {/* `bg-paper`, not `paper-sunk`: the mat is for
                          photography, and this is a block of instructions.
                          On paper the ink-muted steps read at 5.61:1. */}
                      <div className="mt-5 rounded-plate border border-line bg-paper p-5">
                        <h3 className="mb-4 text-center text-h3 text-ink">Pay with any UPI app</h3>
                        <div className="flex flex-col items-center gap-5">
                          <div className="w-full max-w-xs rounded-plate border border-line bg-paper-raised p-5 text-center">
                            <div className="eyebrow text-ink-muted">Pay to</div>
                            {/* `.num` + tracking-wide, not font-mono: a third
                          typeface has no place in a two-face system, and what
                          the UPI id actually needs is tabular figures and air
                          between the characters. */}
                            <div className="num mt-2 break-all text-body tracking-wide text-ink">
                              {STORE_UPI_ID}
                            </div>
                            <div className="num mt-3 text-price text-zari-700">
                              {formatPrice(costBreakdown.total)}
                            </div>
                          </div>

                          <ul className="space-y-1 text-center text-body-sm text-ink-muted">
                            <li>Open any UPI app (PhonePe, Google Pay, Paytm)</li>
                            <li>
                              Send {formatPrice(costBreakdown.total)} to {STORE_UPI_ID}
                            </li>
                            <li>Complete the payment, then confirm below</li>
                          </ul>
                        </div>
                      </div>

                      {/* Payment confirmation */}
                      <div className="mt-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            id="paymentConfirmed"
                            ref={paymentConfirmRef}
                            checked={paymentConfirmed}
                            onChange={(event) => {
                              setPaymentConfirmed(event.target.checked);
                              if (event.target.checked) setPaymentError(null);
                            }}
                            aria-invalid={paymentError ? true : undefined}
                            aria-describedby={paymentError ? 'paymentConfirmed-error' : undefined}
                            className="mt-1 h-4 w-4 shrink-0 rounded-xs accent-ink"
                          />
                          <label htmlFor="paymentConfirmed" className="text-body-sm text-ink">
                            {`I confirm that I have completed the UPI payment of ${formatPrice(costBreakdown.total)}`}
                          </label>
                        </div>
                        {paymentError ? (
                          <p
                            id="paymentConfirmed-error"
                            role="alert"
                            className="mt-2 text-body-sm text-madder"
                          >
                            {paymentError}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Shipping recap, so the shopper can check the address before paying */}
                  {/* paper-raised for the same reason as the summary above: the Edit
                control is zari-700 at 16px, and an interactive control on the
                purchase path cannot sit at 4.42:1. */}
                  <div className="mb-6 rounded-plate border border-line bg-paper-raised p-5">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <h3 className="eyebrow text-ink-muted">Delivering to</h3>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('address')}
                        className="thread-link text-body font-medium text-zari-700"
                      >
                        Edit
                      </button>
                    </div>
                    <address className="text-body not-italic leading-relaxed text-ink-muted">
                      {shippingAddress.fullName}
                      <br />
                      {shippingAddress.addressLine1}
                      {shippingAddress.addressLine2 ? (
                        <>
                          <br />
                          {shippingAddress.addressLine2}
                        </>
                      ) : null}
                      <br />
                      {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                      <br />
                      {shippingAddress.country}
                      <br />
                      {shippingAddress.phone}
                    </address>
                  </div>

                  {/* The shared banner recipe. It sets no text colour on purpose —
                the copy inherits ink here (13.1:1); `text-madder` on the tint
                was the old hand-rolled version and is not portable to ink. */}
                  {orderError ? (
                    <p role="alert" className="banner banner-error mb-6">
                      {orderError}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('address')}
                      className="btn-secondary w-full"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isPlacingOrder}
                      aria-busy={isPlacingOrder}
                      className={isPlacingOrder ? 'btn-cart-disabled' : 'btn-cart'}
                    >
                      {isPlacingOrder
                        ? 'Processing...'
                        : `Place Order - ${formatPrice(costBreakdown.total)}`}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* The money, parked. It is in view while the address is typed and
                still in view while the payment method is chosen. */}
            <aside aria-label="Order summary" className="lg:sticky lg:top-8 lg:self-start">
              {orderSummary}
            </aside>
          </div>
        )}

        {/* Step 3: Order Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="mx-auto max-w-2xl rounded-plate border border-line bg-paper-raised p-8 text-center md:p-10">
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-pill border border-line-strong bg-paper-sunk text-neem">
              <CheckIcon />
            </span>
            <SectionHeading eyebrow="Confirmed" title="Order placed successfully" align="center" />
            <p className="mx-auto mt-4 max-w-[46ch] text-body text-ink-muted">
              Thank you for your order. We&apos;ll process it and ship it to your address soon.
            </p>

            {placedOrder ? (
              <>
                {/*
                  The one thing a shopper needs off this screen: a number they
                  can quote. It was a `text-body-sm` row in a definition list,
                  indistinguishable from the payment method beside it. Here it
                  is the loudest element on the panel — `text-price-lg`, on the
                  page ground so it reads as a plate of its own, with the same
                  eight uppercase characters the order history prints.
                */}
                <div className="mx-auto mt-8 max-w-sm rounded-plate border border-line-strong bg-paper p-5">
                  <p className="eyebrow text-ink-muted">Order number</p>
                  <p className="num mt-3 text-price-lg tracking-wide text-ink">
                    #{orderNumber(placedOrder.id)}
                  </p>
                  <p className="mx-auto mt-3 max-w-[34ch] text-body-sm text-ink-muted">
                    Quote this if you write to us about the order. It is on your order history too.
                  </p>
                </div>

                <dl className="mx-auto mt-6 max-w-sm space-y-3 text-body-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Placed</dt>
                    <dd className="num text-ink">{formatOrderDate(placedOrder.created_at)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Amount</dt>
                    <dd className="num text-price text-zari-700">
                      {formatPrice(Number(placedOrder.total_amount) || 0)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Payment</dt>
                    <dd className="text-ink">
                      {placedOrder.payment_method === 'upi' ? 'UPI' : 'Cash on Delivery'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-ink-muted">Delivering to</dt>
                    <dd className="text-right text-ink">
                      {placedOrder.shipping_address?.fullName}
                      {placedOrder.shipping_address?.city ? (
                        <span className="block text-ink-muted">
                          {placedOrder.shipping_address.city},{' '}
                          <span className="num">{placedOrder.shipping_address.postalCode}</span>
                        </span>
                      ) : null}
                    </dd>
                  </div>
                </dl>
              </>
            ) : null}

            <div className="mt-8 space-y-4">
              <div className="mx-auto max-w-xs">
                <button type="button" onClick={() => router.push('/orders')} className="btn-cart">
                  Track this order
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="thread-link text-body font-medium text-zari-700"
                >
                  Continue shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
