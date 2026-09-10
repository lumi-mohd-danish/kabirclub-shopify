'use client';

import {
  GST_RATE,
  computeCartCost,
  getCart,
  placeOrder,
  type CartLineWithSize,
  type CartWithSizes,
  type PlacedOrderRow
} from '@/lib/supabase/api';
import { getCartSessionId } from '@/components/cart/actions';
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
 * The cookie is httpOnly (set server-side by the add-to-cart action), so it is
 * deliberately invisible to `document.cookie`. The only way to read it from the
 * browser is the `getCartSessionId` server action.
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
      const sessionId = await getSessionId();
      setCart(sessionId ? await getCart(sessionId) : null);
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
      const order = await placeOrder({
        sessionId,
        items: cartLines.map((line) => ({
          product: line.merchandise.product,
          quantity: line.quantity,
          // So placeOrder clears only these lines, not the whole session.
          cartLineId: line.id,
          // The size the shopper actually chose, not a hardcoded 'M'.
          size: getLineSize(line),
          // Line totals are recomputed from price x quantity by `placeOrder`;
          // this is the same figure shown in the summary above.
          totalPrice: computeCartCost([line]).subtotal
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
        <div className="text-center">
          <div className="mx-auto mb-5 h-16 w-16 animate-spin rounded-pill border-b-2 border-zari-700"></div>
          <h1 className="font-display text-h2 text-ink">Loading your cart...</h1>
        </div>
      </div>
    );
  }

  // The cart is emptied once the order is placed, so the confirmation step must
  // never be replaced by the empty-cart screen.
  if (currentStep !== 'confirmation' && (cartLines.length === 0 || costBreakdown.total <= 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="px-5 text-center">
          <p className="eyebrow text-ink-muted">Checkout</p>
          <h1 className="mt-3 font-display text-h2 text-ink">
            {loadError ? 'We could not load your cart' : 'Your cart is empty'}
          </h1>
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

  const orderSummary = (
    <div className="mb-6 rounded-plate border border-line bg-paper-sunk p-5">
      <h3 className="eyebrow mb-4 text-ink-muted">Order Summary</h3>
      <div className="space-y-2 text-body text-ink">
        {cartLines.map((line) => {
          const size = getLineSize(line);

          return (
            <div key={line.id} className="flex justify-between gap-4">
              <span>
                {line.merchandise.product.title}
                {size ? ` (Size ${size})` : ''} x {line.quantity}
              </span>
              <span className="num whitespace-nowrap">
                {formatPrice(computeCartCost([line]).subtotal)}
              </span>
            </div>
          );
        })}
        <div className="mt-3 space-y-2 border-t border-line pt-3">
          <div className="flex justify-between">
            <span className="text-ink-muted">Subtotal</span>
            <span className="num">{formatPrice(costBreakdown.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="num text-ink-muted">{gstLabel}</span>
            <span className="num">{formatPrice(costBreakdown.gst)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Shipping</span>
            <span className="num">
              {costBreakdown.shipping > 0 ? formatPrice(costBreakdown.shipping) : 'Free'}
            </span>
          </div>
          <div className="rule-zari !mt-3" />
          <div className="flex items-center justify-between">
            <span className="font-medium">Total</span>
            <span className="num text-price text-zari-700">{formatPrice(costBreakdown.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper py-16 text-ink md:py-24">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="rule-zari mx-auto w-16" />
          <h1 className="mt-5 font-display text-h1 text-ink">Checkout</h1>
          <ol aria-label="Checkout progress" className="mt-6 flex justify-center gap-4">
            {CHECKOUT_STEPS.map((step, index) => (
              <li
                key={step.id}
                aria-current={currentStep === step.id ? 'step' : undefined}
                className={`num flex h-8 w-8 items-center justify-center rounded-pill text-body-sm ${
                  currentStep === step.id
                    ? 'bg-ink-900 text-paper'
                    : 'border border-line-strong bg-paper text-ink-muted'
                }`}
              >
                <span aria-hidden="true">{index + 1}</span>
                <span className="sr-only">{`Step ${index + 1}: ${step.label}`}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Step 1: Shipping Address */}
        {currentStep === 'address' && (
          <form
            noValidate
            onSubmit={handleAddressSubmit}
            className="rounded-plate border border-line bg-paper-raised p-6 md:p-8"
          >
            <h2 className="mb-6 font-display text-h2 text-ink">Shipping Address</h2>
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
            <h2 className="mb-6 font-display text-h2 text-ink">Payment Method</h2>

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
                  className="field num bg-paper-sunk"
                />
                <p className="mt-2 text-body-sm text-ink-muted">
                  This is our registered UPI ID for payments
                </p>

                {/* UPI payment instructions */}
                <div className="mt-5 rounded-plate border border-line bg-paper-sunk p-5">
                  <h3 className="mb-4 text-center text-h3 text-ink">Pay with any UPI app</h3>
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-full max-w-xs rounded-plate border border-line bg-paper-raised p-5 text-center">
                      <div className="eyebrow text-ink-muted">Pay to</div>
                      <div className="mt-2 break-all font-mono text-body text-ink">
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

            {/* Order Summary */}
            {orderSummary}

            {/* Shipping recap, so the shopper can check the address before paying */}
            <div className="mb-6 rounded-plate border border-line bg-paper-sunk p-5">
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

            {orderError ? (
              <p
                role="alert"
                className="mb-6 rounded-control border border-madder bg-madder/10 px-4 py-3 text-body-sm text-madder"
              >
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

        {/* Step 3: Order Confirmation */}
        {currentStep === 'confirmation' && (
          <div className="rounded-plate border border-line bg-paper-raised p-8 text-center md:p-10">
            <div className="mb-5 text-6xl" aria-hidden="true">
              ✅
            </div>
            <p className="eyebrow text-ink-muted">Confirmed</p>
            <h2 className="mt-3 font-display text-h2 text-ink">Order Placed Successfully!</h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-body text-ink-muted">
              Thank you for your order. We&apos;ll process it and ship it to your address soon.
            </p>
            {placedOrder ? (
              <dl className="mx-auto my-8 max-w-sm space-y-3 text-body-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-ink-muted">Order reference</dt>
                  <dd className="num font-mono text-ink">
                    {placedOrder.id.slice(0, 8).toUpperCase()}
                  </dd>
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
              </dl>
            ) : null}
            <div className="mt-8 space-y-4">
              <button type="button" onClick={() => router.push('/')} className="btn-cart">
                Continue Shopping
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => router.push('/orders')}
                  className="thread-link text-body font-medium text-zari-700"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
