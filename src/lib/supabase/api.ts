import {
  CartItem,
  Collection,
  Product,
  isSupabaseConfigured,
  supabase,
  type SupabaseDbClient
} from '../supabase';
import type { Cart, CartLine, Order, Page, ShippingAddress } from './types';

export type { SupabaseDbClient };

// ---------------------------------------------------------------------------
// Commercial rules
//
// These are the rules the storefront has always applied. They are declared once
// here so the cart drawer, the checkout summary and the persisted order can
// never disagree with each other.
// ---------------------------------------------------------------------------

/** GST applied to the cart subtotal (18%). */
/**
 * Maximum units of one product on a single cart line. Exported so the server
 * action, the quantity stepper and this module cannot drift apart.
 */
export const MAX_LINE_QUANTITY = 99;

export const GST_RATE = 0.18;

/** Flat shipping charge in INR. Shipping is currently free on every order. */
export const SHIPPING_FLAT_RATE = 0;

/** Currency every price in this store is quoted in. */
export const CURRENCY_CODE = 'INR';

/** Default page size for `getProducts`. */
export const DEFAULT_PRODUCTS_PAGE_SIZE = 24;

/** Hard ceiling on `getProducts` page size, so one call cannot pull the whole table. */
export const MAX_PRODUCTS_PAGE_SIZE = 1000;

/** Local asset used when a product has no usable image URL. */
export const PLACEHOLDER_IMAGE = '/images/placeholder.png';

/** Columns products may be sorted by. Anything else falls back to `created_at`. */
const SORTABLE_PRODUCT_COLUMNS = ['created_at', 'updated_at', 'price', 'title'] as const;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Money breakdown for a cart or an order. Every number is rounded to 2 decimals. */
export interface CartCostBreakdown {
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
}

/** Minimal shape `computeCartCost` needs when the caller does not have full cart lines. */
export interface CartCostLineInput {
  quantity: number;
  unitPrice: number;
}

/** `computeCartCost` accepts real cart lines or the minimal `{ quantity, unitPrice }` shape. */
export type CartCostLine = CartLine | CartCostLineInput;

/** A cart line that carries the size the shopper actually picked. */
export interface CartLineWithSize extends CartLine {
  /** Size chosen at add-to-cart time. `null` when the DB column has not been migrated yet. */
  size: string | null;
}

/** Cart returned by `getCart`: adds per-line sizes and a numeric cost breakdown. */
export interface CartWithSizes extends Cart {
  lines: CartLineWithSize[];
  costBreakdown: CartCostBreakdown;
}

/** A `cart_items` row, including the size column added by `add-cart-item-size.sql`. */
export interface CartItemWithSize extends CartItem {
  size?: string | null;
}

/** Result of a paginated product query. */
export interface ProductsQueryResult {
  products: Product[];
  /** True number of matching rows, not the length of this page. */
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface GetProductsOptions {
  query?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Zero-based page index. Ignored when `offset` is supplied. */
  page?: number;
  /** Explicit row offset. Takes precedence over `page`. */
  offset?: number;
  limit?: number;
  /** Admin-only: also return products with `is_active = false`. */
  includeInactive?: boolean;
}

/**
 * One line of a checkout request.
 *
 * NOTHING ON THIS OBJECT SETS A PRICE. `placeOrder` re-reads every unit price
 * from the `products` table by `product_id`, so a caller can only choose *what*
 * and *how many* — never *how much*.
 */
export interface PlaceOrderItemInput {
  /** The product's primary key. This is the only identity `placeOrder` trusts. */
  productId?: string;
  /**
   * Legacy call shape: a whole product object. Only `product.id` is read, and
   * only when `productId` is absent. Its `price` is ignored like every other
   * amount the caller sends. Prefer `productId`.
   */
  product?: Product;
  quantity: number;
  /** Size the shopper selected. Defaults to 'M' when absent. */
  size?: string;
  /** Ignored. Line totals are always recomputed from the database price x quantity. */
  totalPrice?: number;
  /**
   * The `cart_items.id` this line came from. Supplied so checkout clears only
   * the lines it actually ordered — anything added in another tab after the
   * checkout page took its snapshot survives instead of being silently binned.
   */
  cartLineId?: string;
}

export interface PlaceOrderInput {
  sessionId: string;
  items: PlaceOrderItemInput[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  upiId?: string;
}

/** The `orders` row returned after a successful checkout. */
export interface PlacedOrderRow {
  id: string;
  session_id: string;
  shipping_address: ShippingAddress;
  payment_method: string;
  upi_id: string | null;
  payment_status: string;
  order_status: string;
  subtotal: number;
  shipping_cost: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  title: string;
  path: string;
}

// ---------------------------------------------------------------------------
// Fallback data, used only when Supabase is not configured
// ---------------------------------------------------------------------------

const fallbackProducts: Product[] = [
  {
    id: '1',
    title: 'Classic White T-Shirt',
    description: 'Premium cotton t-shirt in classic white',
    price: 999.0,
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=60'],
    category: 'Topwear',
    handle: 'classic-white-tshirt-12345',
    sizes: ['S', 'M', 'L', 'XL'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Denim Jeans',
    description: 'Comfortable denim jeans with perfect fit',
    price: 1999.0,
    images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=60'],
    category: 'Bottomwear',
    handle: 'denim-jeans-67890',
    sizes: ['M', 'L', 'XL', 'XXL'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Casual Shirt',
    description: 'Elegant casual shirt for any occasion',
    price: 1499.0,
    images: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=60'],
    category: 'Topwear',
    handle: 'casual-shirt-54321',
    sizes: ['S', 'M', 'L'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

const fallbackCollections: Collection[] = [
  {
    id: '1',
    title: 'Topwear',
    description: 'All top clothing items',
    handle: 'topwear',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Bottomwear',
    description: 'All bottom clothing items',
    handle: 'bottomwear',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** True when a real Supabase project is configured; false means "serve fallback data". */
const checkSupabase = (): boolean => isSupabaseConfigured();

/**
 * Pick the client a cart or order call should talk to.
 *
 * Every cart/order function takes an optional client so a server action can hand
 * in a session-scoped one (`createSessionClient`, which carries the
 * `x-session-id` header the RLS policies read). Callers that pass nothing keep
 * the module-level singleton and behave exactly as before.
 *
 * Returns `null` when Supabase is unconfigured, so callers keep their existing
 * "no client, serve fallback" branch.
 */
const resolveClient = (client?: SupabaseDbClient | null): SupabaseDbClient | null => {
  if (!checkSupabase()) return null;
  return client ?? supabase;
};

/** Round to 2 decimals so no raw float (243.07999999999998) ever leaves this module. */
const roundMoney = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const toMoney = (value: number) => ({
  amount: roundMoney(value).toFixed(2),
  currencyCode: CURRENCY_CODE
});

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toNonNegativeInt = (value: unknown, fallback: number): number => {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normaliseSize = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const sameSize = (a: unknown, b: unknown): boolean =>
  normaliseSize(a).toLowerCase() === normaliseSize(b).toLowerCase();

/**
 * PostgREST `or()` filters are parsed from a string, so a comma or a parenthesis
 * in user input would otherwise let a shopper inject extra filter expressions.
 * Double quoting (with backslash escaping) makes the value opaque to the parser.
 */
const quoteFilterValue = (value: string): string =>
  `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const resolveSortColumn = (sortBy: string | undefined): string =>
  (SORTABLE_PRODUCT_COLUMNS as readonly string[]).includes(sortBy ?? '') ? (sortBy as string) : 'created_at';

const INVALID_IMAGE_HOST = /(^|\.)example\.(com|org|net)$/i;

/** A URL we are willing to hand to `next/image`: a local asset or a real remote http(s) URL. */
const isUsableImageUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    return !INVALID_IMAGE_HOST.test(new URL(trimmed).hostname);
  } catch {
    return false;
  }
};

/**
 * Drop the individual unusable image URLs from a product and keep the product.
 * A bad placeholder URL on one row must never remove real products from the catalogue.
 */
const sanitiseProduct = (product: Product): Product => {
  const images = Array.isArray(product?.images)
    ? product.images.map(image => (typeof image === 'string' ? image.trim() : image)).filter(isUsableImageUrl)
    : [];

  return {
    ...product,
    images: images.length > 0 ? images : [PLACEHOLDER_IMAGE]
  };
};

const sanitiseProducts = (products: Product[]): Product[] => products.map(sanitiseProduct);

/**
 * `cart_items.size` ships in `add-cart-item-size.sql`. Until an owner runs that
 * migration the column is missing, and PostgREST answers with an undefined-column
 * error. Detecting it lets the cart keep working on an un-migrated database.
 */
const MISSING_COLUMN_CODES = new Set(['42703', 'PGRST204']);

const isMissingSizeColumnError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  if (error.code && MISSING_COLUMN_CODES.has(error.code)) return true;
  return /(column\s+.*size.*\s+does not exist)|(could not find the '?size'? column)/i.test(error.message ?? '');
};

// ---------------------------------------------------------------------------
// Cart cost — the single source of truth for money
// ---------------------------------------------------------------------------

/**
 * The one place cart money is calculated. Returns numbers already rounded to
 * two decimals, and a `total` that is exactly `subtotal + gst + shipping` of
 * the rounded parts, so a rendered breakdown always adds up.
 *
 * Accepts either real cart lines (`cart.lines`) or the minimal
 * `{ quantity, unitPrice }` shape.
 */
export function computeCartCost(lines: readonly CartCostLine[]): CartCostBreakdown {
  const rawSubtotal = (lines ?? []).reduce((sum, line) => {
    if (!line) return sum;

    const unitPrice = 'unitPrice' in line ? Number(line.unitPrice) : Number(line.merchandise?.product?.price);
    const quantity = Number(line.quantity);

    if (!Number.isFinite(unitPrice) || !Number.isFinite(quantity)) return sum;

    return sum + unitPrice * quantity;
  }, 0);

  const subtotal = roundMoney(Math.max(0, rawSubtotal));
  const gst = roundMoney(subtotal * GST_RATE);
  const shipping = roundMoney(SHIPPING_FLAT_RATE);

  return {
    subtotal,
    gst,
    shipping,
    total: roundMoney(subtotal + gst + shipping)
  };
}

/** Turn `cart_items` rows (joined with products) into the Cart shape the UI renders. */
const convertCartItemsToCart = (cartItems: CartItemWithSize[], sessionId: string): CartWithSizes => {
  const lines: CartLineWithSize[] = cartItems
    .filter(item => Boolean(item?.products))
    .map(item => {
      const product = sanitiseProduct(item.products!);
      const quantity = toPositiveInt(item.quantity, 1);
      const size = normaliseSize(item.size) || null;
      const unitPrice = Number(product.price) || 0;

      return {
        id: item.id,
        quantity,
        size,
        merchandise: {
          id: item.product_id,
          title: product.title,
          product,
          selectedOptions: size ? [{ name: 'Size', value: size }] : []
        },
        cost: {
          // Line amount is the whole line: unit price x quantity.
          totalAmount: toMoney(unitPrice * quantity)
        }
      };
    });

  const costBreakdown = computeCartCost(lines);

  return {
    id: sessionId,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    costBreakdown,
    cost: {
      totalAmount: toMoney(costBreakdown.total),
      subtotalAmount: toMoney(costBreakdown.subtotal),
      totalTaxAmount: toMoney(costBreakdown.gst)
    },
    checkoutUrl: '/checkout'
  };
};

// ---------------------------------------------------------------------------
// Products API
// ---------------------------------------------------------------------------

export async function getProducts({
  query,
  category,
  sortBy = 'created_at',
  sortOrder = 'desc',
  page = 0,
  offset,
  limit = DEFAULT_PRODUCTS_PAGE_SIZE,
  includeInactive = false
}: GetProductsOptions = {}): Promise<ProductsQueryResult> {
  const resolvedLimit = Math.min(toPositiveInt(limit, DEFAULT_PRODUCTS_PAGE_SIZE), MAX_PRODUCTS_PAGE_SIZE);
  const resolvedOffset =
    offset === undefined ? toNonNegativeInt(page, 0) * resolvedLimit : toNonNegativeInt(offset, 0);
  const trimmedQuery = query?.trim();
  const trimmedCategory = category?.trim();

  if (!checkSupabase()) {
    let filteredProducts = fallbackProducts;

    if (!includeInactive) {
      filteredProducts = filteredProducts.filter(p => p.is_active !== false);
    }

    if (trimmedCategory) {
      // Category filtering is case-insensitive: URL handles are lowercase while
      // `products.category` is capitalised.
      filteredProducts = filteredProducts.filter(
        p => p.category?.toLowerCase() === trimmedCategory.toLowerCase()
      );
    }

    if (trimmedQuery) {
      const needle = trimmedQuery.toLowerCase();
      filteredProducts = filteredProducts.filter(
        p => p.title.toLowerCase().includes(needle) || p.description?.toLowerCase().includes(needle)
      );
    }

    const pageItems = filteredProducts.slice(resolvedOffset, resolvedOffset + resolvedLimit);

    return {
      products: sanitiseProducts(pageItems),
      total: filteredProducts.length,
      limit: resolvedLimit,
      offset: resolvedOffset,
      hasMore: resolvedOffset + pageItems.length < filteredProducts.length
    };
  }

  const buildQuery = (head: boolean) => {
    let queryBuilder = supabase!.from('products').select('*', { count: 'exact', head });

    if (!includeInactive) {
      queryBuilder = queryBuilder.eq('is_active', true);
    }

    if (trimmedQuery) {
      const pattern = quoteFilterValue(`%${trimmedQuery}%`);
      queryBuilder = queryBuilder.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }

    if (trimmedCategory) {
      queryBuilder = queryBuilder.ilike('category', trimmedCategory);
    }

    return queryBuilder;
  };

  const { data, error, count } = await buildQuery(false)
    .order(resolveSortColumn(sortBy), { ascending: sortOrder === 'asc' })
    .range(resolvedOffset, resolvedOffset + resolvedLimit - 1);

  if (error) {
    // PostgREST answers 416/PGRST103 when the requested page starts past the
    // last row. That is an empty page, not a failure — report the real total
    // so the caller can navigate back into range.
    if (error.code === 'PGRST103') {
      const { count: totalCount } = await buildQuery(true);

      return {
        products: [],
        total: typeof totalCount === 'number' ? totalCount : 0,
        limit: resolvedLimit,
        offset: resolvedOffset,
        hasMore: false
      };
    }

    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const products = sanitiseProducts((data as Product[]) ?? []);
  const total = typeof count === 'number' ? count : resolvedOffset + products.length;

  return {
    products,
    total,
    limit: resolvedLimit,
    offset: resolvedOffset,
    hasMore: resolvedOffset + products.length < total
  };
}

export async function getProduct(handle: string): Promise<Product | null> {
  if (!checkSupabase()) {
    return fallbackProducts.find(p => p.handle === handle) ?? null;
  }

  const { data, error } = await supabase!
    .from('products')
    .select('*')
    .eq('handle', handle)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return sanitiseProduct(data as Product);
}

/**
 * Look a product up by primary key.
 *
 * Defaults to `includeInactive: true` because its consumer is the admin edit
 * page, which has to be able to open (and re-enable) a disabled product. Pass
 * `{ includeInactive: false }` for storefront use.
 */
export async function getProductById(
  id: string,
  {
    includeInactive = true,
    sanitise = false
  }: { includeInactive?: boolean; sanitise?: boolean } = {}
): Promise<Product | null> {
  // `sanitise` defaults to FALSE here, unlike every storefront getter. The only
  // consumer is the admin edit form, which seeds its state from what it is
  // given and posts it straight back — so substituting a placeholder path for a
  // missing image would silently overwrite the stored value on save.
  if (!id) return null;

  if (!checkSupabase()) {
    const product = fallbackProducts.find(p => p.id === id);
    if (!product) return null;
    if (!includeInactive && product.is_active === false) return null;
    return sanitise ? sanitiseProduct(product) : product;
  }

  let queryBuilder = supabase!.from('products').select('*').eq('id', id);

  if (!includeInactive) {
    queryBuilder = queryBuilder.eq('is_active', true);
  }

  const { data, error } = await queryBuilder.maybeSingle();

  if (error || !data) {
    return null;
  }

  return sanitise ? sanitiseProduct(data as Product) : (data as Product);
}

export async function getProductRecommendations(productId: string, limit = 3): Promise<Product[]> {
  const resolvedLimit = toPositiveInt(limit, 3);

  if (!checkSupabase()) {
    return sanitiseProducts(fallbackProducts.filter(p => p.id !== productId).slice(0, resolvedLimit));
  }

  const { data, error } = await supabase!
    .from('products')
    .select('*')
    .neq('id', productId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(resolvedLimit);

  if (error) {
    return [];
  }

  return sanitiseProducts((data as Product[]) ?? []);
}

// ---------------------------------------------------------------------------
// Collections API
// ---------------------------------------------------------------------------

export async function getCollections(): Promise<Collection[]> {
  if (!checkSupabase()) {
    return fallbackCollections;
  }

  const { data, error } = await supabase!
    .from('collections')
    .select('*')
    .order('title', { ascending: true });

  if (error) {
    return [];
  }

  return (data as Collection[]) ?? [];
}

export async function getCollection(handle: string): Promise<Collection | null> {
  if (!checkSupabase()) {
    return fallbackCollections.find(c => c.handle === handle) ?? null;
  }

  const { data, error } = await supabase!
    .from('collections')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as Collection;
}

export async function getCollectionProducts({
  collection,
  sortBy = 'created_at',
  sortOrder = 'desc',
  limit = 100
}: {
  collection: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}): Promise<Product[]> {
  const resolvedLimit = Math.min(toPositiveInt(limit, 100), MAX_PRODUCTS_PAGE_SIZE);
  const trimmedCollection = collection?.trim();

  if (!trimmedCollection) return [];

  if (!checkSupabase()) {
    // Collection handles are lowercase ('topwear'); categories are capitalised
    // ('Topwear'). Compare case-insensitively or every collection reads as empty.
    return sanitiseProducts(
      fallbackProducts
        .filter(p => p.category?.toLowerCase() === trimmedCollection.toLowerCase())
        .slice(0, resolvedLimit)
    );
  }

  const { data, error } = await supabase!
    .from('products')
    .select('*')
    // `.ilike` without wildcards is a case-insensitive exact match, so the
    // lowercase URL handle matches the capitalised `products.category`.
    .ilike('category', trimmedCollection)
    .eq('is_active', true)
    .order(resolveSortColumn(sortBy), { ascending: sortOrder === 'asc' })
    .limit(resolvedLimit);

  if (error) {
    return [];
  }

  return sanitiseProducts((data as Product[]) ?? []);
}

// ---------------------------------------------------------------------------
// Cart API
// ---------------------------------------------------------------------------

export async function getCart(
  sessionId: string,
  client?: SupabaseDbClient | null
): Promise<CartWithSizes | null> {
  const db = resolveClient(client);

  if (!db || !sessionId) {
    return null;
  }

  const { data, error } = await db
    .from('cart_items')
    .select(
      `
      *,
      products (*)
    `
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return null;
  }

  return convertCartItemsToCart(data as CartItemWithSize[], sessionId);
}

/**
 * Add a product to the cart.
 *
 * `size` is required: the shopper's selected size is part of the line's identity,
 * so the same product in two sizes is two lines. The size is persisted on
 * `cart_items.size` (see `add-cart-item-size.sql`); if that migration has not
 * been run yet the insert transparently retries without the column so the cart
 * keeps working.
 *
 * `client` lets a server action pass a session-scoped client so the write also
 * satisfies the `x-session-id` row-level security policies.
 */
export async function addToCart(
  {
    productId,
    quantity,
    size,
    sessionId,
    userId
  }: {
    productId: string;
    quantity: number;
    size: string;
    sessionId: string;
    userId?: string;
  },
  client?: SupabaseDbClient | null
): Promise<CartItemWithSize | null> {
  const db = resolveClient(client);

  if (!db || !productId || !sessionId) {
    return null;
  }

  const resolvedQuantity = toPositiveInt(quantity, 1);
  const resolvedSize = normaliseSize(size) || 'M';

  // Fetch every line for this product/session and match the size in JS. Doing
  // the size match here (rather than as a `.eq('size', ...)` filter) keeps the
  // query valid on databases where the column has not been added yet.
  const { data: existingItems, error: selectError } = await db
    .from('cart_items')
    .select('*')
    .eq('product_id', productId)
    .eq('session_id', sessionId);

  if (selectError) {
    return null;
  }

  const rows = (existingItems as CartItemWithSize[]) ?? [];
  const sizeColumnPresent = rows.some(row => Object.prototype.hasOwnProperty.call(row, 'size'));
  const existingItem = rows.find(row => (sizeColumnPresent ? sameSize(row.size, resolvedSize) : true)) ?? null;

  if (existingItem) {
    const { data, error } = await db
      .from('cart_items')
      .update({
        quantity: Math.min(
          toPositiveInt(existingItem.quantity, 0) + resolvedQuantity,
          MAX_LINE_QUANTITY
        )
      })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data as CartItemWithSize;
  }

  const basePayload = {
    product_id: productId,
    quantity: resolvedQuantity,
    session_id: sessionId,
    user_id: userId ?? null
  };

  const withSize = await db
    .from('cart_items')
    .insert({ ...basePayload, size: resolvedSize })
    .select()
    .single();

  if (!withSize.error) {
    return withSize.data as CartItemWithSize;
  }

  if (!isMissingSizeColumnError(withSize.error)) {
    return null;
  }

  const withoutSize = await db.from('cart_items').insert(basePayload).select().single();

  if (withoutSize.error) {
    return null;
  }

  return withoutSize.data as CartItemWithSize;
}

/**
 * Update a cart line. Quantity is clamped to at least 1 — callers that want the
 * line gone should call `removeFromCart`. Passing `size` moves the line to a
 * different size (ignored when the `cart_items.size` migration has not been run).
 *
 * `sessionId` scopes the write to the caller's own cart. Without it, knowing a
 * line UUID would be enough to edit another shopper's cart. `client` lets a
 * server action pass a session-scoped client so Postgres enforces the same
 * scoping through RLS.
 */
export async function updateCartItem(
  {
    itemId,
    quantity,
    size,
    sessionId
  }: {
    itemId: string;
    quantity: number;
    size?: string;
    sessionId?: string;
  },
  client?: SupabaseDbClient | null
): Promise<CartItemWithSize | null> {
  const db = resolveClient(client);

  if (!db || !itemId) {
    return null;
  }

  const resolvedQuantity = Math.max(1, toPositiveInt(quantity, 1));
  const resolvedSize = normaliseSize(size);

  if (resolvedSize) {
    const withSize = await db
      .from('cart_items')
      .update({ quantity: resolvedQuantity, size: resolvedSize })
      .eq('id', itemId)
      .eq('session_id', sessionId ?? '')
      .select()
      .single();

    if (!withSize.error) {
      return withSize.data as CartItemWithSize;
    }

    if (!isMissingSizeColumnError(withSize.error)) {
      return null;
    }
  }

  const { data, error } = await db
    .from('cart_items')
    .update({ quantity: resolvedQuantity })
    .eq('id', itemId)
    .eq('session_id', sessionId ?? '')
    .select()
    .single();

  if (error) {
    return null;
  }

  return data as CartItemWithSize;
}

/**
 * Delete a cart line. `sessionId` scopes the delete to the caller's own cart —
 * without it, a known line UUID would be enough to empty someone else's cart.
 */
export async function removeFromCart(
  itemId: string,
  sessionId?: string,
  client?: SupabaseDbClient | null
): Promise<boolean> {
  const db = resolveClient(client);

  if (!db || !itemId) {
    return false;
  }

  const { error } = await db
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('session_id', sessionId ?? '');

  return !error;
}

export async function clearCart(
  sessionId: string,
  client?: SupabaseDbClient | null
): Promise<boolean> {
  const db = resolveClient(client);

  if (!db || !sessionId) {
    return false;
  }

  const { error } = await db.from('cart_items').delete().eq('session_id', sessionId);

  return !error;
}

// ---------------------------------------------------------------------------
// Pages / menu
// ---------------------------------------------------------------------------

const samplePage: Page = {
  id: '1',
  title: 'Sample Page',
  body: '<p>This is a sample page content.</p>',
  bodySummary: 'Sample page content',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export async function getPage(): Promise<Page | null> {
  // There is no `pages` table yet, so both the configured and unconfigured
  // paths serve the same static content.
  return samplePage;
}

const defaultMenu: MenuItem[] = [
  { title: 'Home', path: '/' },
  { title: 'Products', path: '/products' },
  { title: 'About', path: '/about-us' },
  { title: 'Contact', path: '/contact' }
];

export async function getMenu(): Promise<MenuItem[]> {
  // There is no `menu` table yet; navigation is static in both states.
  return defaultMenu;
}

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

/** The only columns `placeOrder` needs when it re-prices a checkout request. */
interface PricedProductRow {
  id: string;
  price: number | string | null;
  is_active?: boolean | null;
}

/**
 * Read the authoritative unit price of every product in a checkout request,
 * straight from the `products` table.
 *
 * Products that do not exist, are withdrawn (`is_active = false`) or carry an
 * unusable price are simply left out of the map, so the caller sees them as
 * "not purchasable" rather than as free.
 */
async function readProductPrices(
  db: SupabaseDbClient,
  productIds: readonly string[]
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();

  if (productIds.length === 0) {
    return prices;
  }

  const { data, error } = await db
    .from('products')
    .select('id, price, is_active')
    .in('id', [...productIds]);

  if (error) {
    throw new Error(`Error pricing order: ${error.message}`);
  }

  for (const row of ((data as PricedProductRow[] | null) ?? [])) {
    if (!row?.id) continue;
    if (row.is_active === false) continue;

    const price = Number(row.price);
    if (!Number.isFinite(price) || price < 0) continue;

    prices.set(String(row.id), roundMoney(price));
  }

  return prices;
}

/**
 * Place an order.
 *
 * THE MONEY IS COMPUTED HERE, FROM THE DATABASE. The caller says *which*
 * product, *how many* and *which size*; it does not get a say in the price.
 * Every unit price is re-read from `products` by `product_id` and every amount
 * the caller sent (`totalPrice`, `product.price`) is discarded, so a tampered
 * client cannot write itself a ₹1 order.
 *
 * This function is safe to call from a server action: it touches no
 * browser-only API, takes its session id as an argument rather than reading a
 * cookie, and accepts the session-scoped client that satisfies the
 * `x-session-id` row-level security policies.
 */
export async function placeOrder(
  orderData: PlaceOrderInput,
  client?: SupabaseDbClient | null
): Promise<PlacedOrderRow> {
  const db = resolveClient(client);

  if (!db) {
    throw new Error('Supabase not configured');
  }

  const { sessionId, items, shippingAddress, paymentMethod, upiId } = orderData;

  if (!sessionId) {
    throw new Error('Cannot place an order without a session');
  }

  // Reduce each requested line to the only three things a shopper may choose:
  // which product, how many, which size. Quantity is clamped to the same ceiling
  // the cart enforces, so a crafted request cannot order 10^9 shirts either.
  const requestedLines = (items ?? [])
    .map(item => ({
      productId:
        (typeof item?.productId === 'string' ? item.productId.trim() : '') ||
        (typeof item?.product?.id === 'string' ? item.product.id.trim() : ''),
      quantity: Math.min(toPositiveInt(item?.quantity, 1), MAX_LINE_QUANTITY),
      size: normaliseSize(item?.size) || 'M',
      cartLineId: typeof item?.cartLineId === 'string' ? item.cartLineId.trim() : ''
    }))
    .filter(line => Boolean(line.productId));

  if (requestedLines.length === 0) {
    throw new Error('Cannot place an order with an empty cart');
  }

  const prices = await readProductPrices(
    db,
    Array.from(new Set(requestedLines.map(line => line.productId)))
  );

  const pricedLines = requestedLines.map(line => {
    const unitPrice = prices.get(line.productId);

    if (unitPrice === undefined) {
      // Missing, withdrawn or unpriced. Refusing the whole order is the honest
      // answer: silently dropping the line would charge for a different cart
      // than the one the shopper confirmed.
      throw new Error(`Product ${line.productId} is not available for purchase`);
    }

    return { ...line, unitPrice };
  });

  // Same calculation the cart drawer shows, so the shopper is charged the
  // amount they were quoted — GST included — only now fed database prices.
  // `orders` has no tax column, so GST is not destructured here — it is carried
  // inside `total` and stays derivable as `total_amount - subtotal - shipping_cost`.
  const { subtotal, shipping, total } = computeCartCost(pricedLines);

  const { data: order, error: orderError } = await db
    .from('orders')
    .insert({
      session_id: sessionId,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      upi_id: upiId ?? null,
      payment_status: 'pending',
      order_status: 'pending',
      subtotal,
      shipping_cost: shipping,
      // Previously this stored the pre-GST subtotal, so the placed order was
      // cheaper than the cart the shopper agreed to. It now includes GST.
      total_amount: total
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`Error creating order: ${orderError?.message ?? 'unknown error'}`);
  }

  const orderItems = pricedLines.map(line => ({
    order_id: order.id,
    product_id: line.productId,
    quantity: line.quantity,
    size: line.size,
    price: line.unitPrice,
    total_price: roundMoney(line.unitPrice * line.quantity)
  }));

  const { error: itemsError } = await db.from('order_items').insert(orderItems);

  if (itemsError) {
    throw new Error(`Error creating order items: ${itemsError.message}`);
  }

  // The order exists at this point; a cart that fails to clear is recoverable
  // and must not fail the checkout.
  //
  // Clear only the lines that were ordered. Deleting the whole session would
  // also destroy anything added after the checkout page took its snapshot —
  // items the shopper never saw on an order and was never charged for.
  //
  // Both branches are scoped by `session_id` as well, so a line id belonging to
  // someone else's cart cannot be deleted by naming it here.
  const orderedLineIds = pricedLines.map(line => line.cartLineId).filter(Boolean);

  if (orderedLineIds.length === pricedLines.length) {
    await db.from('cart_items').delete().eq('session_id', sessionId).in('id', orderedLineIds);
  } else {
    // Older callers do not send line ids; fall back to clearing the session.
    await db.from('cart_items').delete().eq('session_id', sessionId);
  }

  return order as PlacedOrderRow;
}

export async function getOrders(
  sessionId: string,
  client?: SupabaseDbClient | null
): Promise<Order[]> {
  const db = resolveClient(client);

  if (!db) {
    throw new Error('Supabase not configured');
  }

  if (!sessionId) {
    return [];
  }

  const { data: orders, error: ordersError } = await db
    .from('orders')
    .select(
      `
        *,
        order_items (
          *,
          product:products (*)
        )
      `
    )
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (ordersError) {
    throw new Error(`Error fetching orders: ${ordersError.message}`);
  }

  return ((orders as any[]) ?? []).map(order => ({
    id: order.id,
    userId: order.user_id,
    sessionId: order.session_id,
    items: (order.order_items ?? []).map((item: any) => ({
      id: item.id,
      productId: item.product_id,
      product: item.product ? sanitiseProduct(item.product as Product) : item.product,
      quantity: item.quantity,
      size: item.size,
      price: item.price,
      totalPrice: item.total_price
    })),
    shippingAddress: order.shipping_address,
    paymentMethod: order.payment_method,
    upiId: order.upi_id,
    paymentStatus: order.payment_status,
    orderStatus: order.order_status,
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    totalAmount: order.total_amount,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  })) as Order[];
}
