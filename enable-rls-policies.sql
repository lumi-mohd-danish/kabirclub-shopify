-- ============================================================================
-- KabirClub — re-enable Row Level Security with real policies
-- ============================================================================
--
-- This file REPLACES `fix-rls-policies.sql`, which disabled RLS on `products`
-- and `collections`. With RLS off, the public anon key that ships in every
-- browser bundle can INSERT, UPDATE and DELETE the entire catalogue. That is
-- the whole security model of a Supabase project, so it has to be back on.
--
-- HOW TO RUN
--   Paste the whole file into the Supabase SQL Editor (Dashboard → SQL Editor)
--   and run it. It is idempotent: running it twice is safe.
--
-- WHAT IT DOES
--   * products / collections : anyone may read, only admins may write.
--   * cart_items / orders    : each visitor sees only their own rows, scoped by
--                              the signed-in user id or by their cart session.
--   * users                  : you may read and edit your own profile only, and
--                              you cannot promote yourself to admin.
--   * "admin" means role = 'admin' or 'super_admin' on the caller's row in
--     public.users — checked inside Postgres, never in the browser.
--
-- ----------------------------------------------------------------------------
-- !! DO NOT APPLY SECTIONS 6 AND 7 YET !!
-- ----------------------------------------------------------------------------
-- Sections 1-5 and 8-9 are SAFE AND SHOULD BE RUN NOW. They are what stops the
-- public anon key from rewriting your catalogue.
--
-- Sections 6 (cart_items) and 7 (orders) are NOT yet safe to apply. They scope
-- a guest's rows either by `user_id = auth.uid()` or by an `x-session-id`
-- request header. The app sets neither today, so applying them makes every
-- guest cart and guest order return zero rows -- add-to-cart and checkout stop
-- working.
--
-- An earlier draft of this file told you to read the cookie in the browser:
--     document.cookie.match(/(?:^|;\s*)sessionId=([^;]*)/)
-- That is no longer possible. The same changeset that added this file made the
-- `sessionId` cookie httpOnly (src/components/cart/actions.ts), precisely so a
-- cart session cannot be read or forged from JavaScript. The cookie is now
-- invisible to `document.cookie` by design, so the header has to be attached
-- server-side.
--
-- WHAT HAS TO SHIP BEFORE SECTIONS 6-7 CAN BE APPLIED
--   Move the cart and order writes (addToCart / updateCartItem /
--   removeFromCart / placeOrder) behind server actions that read the httpOnly
--   cookie with `cookies().get('sessionId')` and talk to Postgres through a
--   per-request Supabase client carrying that value:
--
--     createClient(url, anonKey, {
--       global: { headers: { 'x-session-id': sessionId } }
--     })
--
--   The module-level singleton in src/lib/supabase.ts cannot do this: it is
--   created once, with no request context. Stamping `user_id` on cart_items and
--   orders for signed-in shoppers is the other half, and removes the need for
--   the header entirely once every shopper has an account.
--
-- This is tracked as follow-up work; it is a real architectural change, not a
-- one-line edit, which is why sections 6-7 are gated rather than shipped half
-- working.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Helper: is the caller an admin?
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER so that policies on public.users can call it without
-- recursing into public.users' own RLS policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 2. Helper: the caller's guest cart session
-- ----------------------------------------------------------------------------
-- Reads the `x-session-id` request header PostgREST exposes as
-- `request.headers`. Returns NULL when the header is absent, which makes every
-- session-scoped policy below evaluate to false rather than to "match all".

CREATE OR REPLACE FUNCTION public.request_session_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(
    coalesce(
      (nullif(current_setting('request.headers', true), '')::json) ->> 'x-session-id',
      ''
    ),
    ''
  );
$$;

REVOKE ALL ON FUNCTION public.request_session_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_session_id() TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. Keep public.users in step with Supabase Auth
-- ----------------------------------------------------------------------------
-- public.users.id must equal auth.users.id, otherwise no signed-in user can
-- ever be matched to a role. This trigger creates the profile row on sign-up
-- and re-links any pre-existing row that was seeded with the same e-mail
-- (so the seeded 'admin' / 'super_admin' rows keep their role once the real
-- account is created with that address).

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- NOTE: this function deliberately does NOT re-link a pre-existing
  -- public.users row by email address. An earlier draft did, which meant
  -- anyone who signed up on the public storefront using a seeded admin
  -- address (admin@kabirclub.com, mohd.danish@kabirclub.com) inherited that
  -- row's 'admin'/'super_admin' role. Roles are granted only by the manual
  -- UPDATE in section 10, run from the SQL editor.
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      split_part(NEW.email, '@', 1)
    ),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE
    SET email     = excluded.email,
        full_name = coalesce(nullif(public.users.full_name, ''), excluded.full_name);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Nobody may grant themselves a role through the REST API. Direct SQL (the
-- dashboard, service_role) has no auth.uid() and is deliberately still allowed.
CREATE OR REPLACE FUNCTION public.guard_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin()
  THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_role_on_update ON public.users;
CREATE TRIGGER guard_user_role_on_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_role();


-- ----------------------------------------------------------------------------
-- 4. products — public read, admin write
-- ----------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products"        ON public.products;
DROP POLICY IF EXISTS "Allow all operations on products"  ON public.products;
DROP POLICY IF EXISTS products_public_read                ON public.products;
DROP POLICY IF EXISTS products_admin_insert               ON public.products;
DROP POLICY IF EXISTS products_admin_update               ON public.products;
DROP POLICY IF EXISTS products_admin_delete               ON public.products;

-- Unpublished products stay hidden from the storefront; admins see everything.
CREATE POLICY products_public_read ON public.products
  FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_admin());

CREATE POLICY products_admin_insert ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_update ON public.products
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY products_admin_delete ON public.products
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- 5. collections — public read, admin write
-- ----------------------------------------------------------------------------

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collections are viewable by everyone" ON public.collections;
DROP POLICY IF EXISTS "Admins can manage collections"        ON public.collections;
DROP POLICY IF EXISTS "Allow all operations on collections"  ON public.collections;
DROP POLICY IF EXISTS collections_public_read                ON public.collections;
DROP POLICY IF EXISTS collections_admin_insert               ON public.collections;
DROP POLICY IF EXISTS collections_admin_update               ON public.collections;
DROP POLICY IF EXISTS collections_admin_delete               ON public.collections;

CREATE POLICY collections_public_read ON public.collections
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY collections_admin_insert ON public.collections
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY collections_admin_update ON public.collections
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY collections_admin_delete ON public.collections
  FOR DELETE TO authenticated
  USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- 6. cart_items — each visitor sees only their own cart
-- ----------------------------------------------------------------------------
-- Requires the `x-session-id` header described at the top of this file.

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON public.cart_items;
DROP POLICY IF EXISTS cart_items_owner_select           ON public.cart_items;
DROP POLICY IF EXISTS cart_items_owner_insert           ON public.cart_items;
DROP POLICY IF EXISTS cart_items_owner_update           ON public.cart_items;
DROP POLICY IF EXISTS cart_items_owner_delete           ON public.cart_items;

CREATE POLICY cart_items_owner_select ON public.cart_items
  FOR SELECT TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
    OR public.is_admin()
  );

CREATE POLICY cart_items_owner_insert ON public.cart_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
  );

CREATE POLICY cart_items_owner_update ON public.cart_items
  FOR UPDATE TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
  );

CREATE POLICY cart_items_owner_delete ON public.cart_items
  FOR DELETE TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
  );


-- ----------------------------------------------------------------------------
-- 7. orders / order_items — customer sees their own, admin sees all
-- ----------------------------------------------------------------------------
-- Orders hold names, phone numbers and postal addresses. With RLS off, the
-- public anon key can read every customer's address, so this is not optional.
-- Same `x-session-id` requirement as section 6.

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_owner_select ON public.orders;
DROP POLICY IF EXISTS orders_owner_insert ON public.orders;
DROP POLICY IF EXISTS orders_admin_update ON public.orders;

CREATE POLICY orders_owner_select ON public.orders
  FOR SELECT TO anon, authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
    OR public.is_admin()
  );

CREATE POLICY orders_owner_insert ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (public.request_session_id() IS NOT NULL AND session_id = public.request_session_id())
  );

-- Only admins may change an order's status after it is placed.
CREATE POLICY orders_admin_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS order_items_owner_select ON public.order_items;
DROP POLICY IF EXISTS order_items_owner_insert ON public.order_items;

CREATE POLICY order_items_owner_select ON public.order_items
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
          OR (public.request_session_id() IS NOT NULL AND o.session_id = public.request_session_id())
          OR public.is_admin()
        )
    )
  );

CREATE POLICY order_items_owner_insert ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          (auth.uid() IS NOT NULL AND o.user_id = auth.uid())
          OR (public.request_session_id() IS NOT NULL AND o.session_id = public.request_session_id())
        )
    )
  );


-- ----------------------------------------------------------------------------
-- 8. users — own profile only, no self-promotion
-- ----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;
DROP POLICY IF EXISTS users_self_select                    ON public.users;
DROP POLICY IF EXISTS users_self_update                    ON public.users;
DROP POLICY IF EXISTS users_admin_all                      ON public.users;

-- The middleware and the /api/upload route read `role` through this policy
-- using the caller's own token, so a user must be able to read their own row.
CREATE POLICY users_self_select ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- Role changes are stripped by guard_user_role() unless an admin makes them.
CREATE POLICY users_self_update ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- No INSERT or DELETE policy: profile rows are created by the
-- on_auth_user_created trigger and removed with the auth user.


-- ----------------------------------------------------------------------------
-- 9. Table grants
-- ----------------------------------------------------------------------------
-- Supabase sets these up by default; they are repeated here so the policies
-- above are the only thing deciding access, not a missing GRANT.

GRANT SELECT ON public.products    TO anon, authenticated;
GRANT SELECT ON public.collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products    TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.collections TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items  TO anon, authenticated;
GRANT SELECT, INSERT                 ON public.orders      TO anon, authenticated;
GRANT UPDATE                         ON public.orders      TO authenticated;
GRANT SELECT, INSERT                 ON public.order_items TO anon, authenticated;
GRANT SELECT, UPDATE                 ON public.users       TO authenticated;


-- ----------------------------------------------------------------------------
-- 10. Promote the store owner
-- ----------------------------------------------------------------------------
-- Create the account first (Dashboard → Authentication → Users → Add user, or
-- the storefront sign-up form), then run this with that e-mail address.
-- Nothing in the app can grant admin; this statement is the only way in.
--
--   UPDATE public.users
--      SET role = 'super_admin'
--    WHERE lower(email) = lower('owner@example.com');


-- ----------------------------------------------------------------------------
-- 11. Optional: enforce the auth link with a foreign key
-- ----------------------------------------------------------------------------
-- The original schema seeded public.users rows with random UUIDs that match no
-- auth user. Those rows can never sign in; the trigger in section 3 re-links
-- one automatically when someone signs up with the same e-mail. Once no orphans
-- remain, you can make the link structural.
--
-- Find orphans:
--   SELECT id, email FROM public.users u
--    WHERE NOT EXISTS (SELECT 1 FROM auth.users a WHERE a.id = u.id);
--
-- Then, if that returns no rows:
--   ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
--   ALTER TABLE public.users
--     ADD CONSTRAINT users_id_fkey FOREIGN KEY (id)
--     REFERENCES auth.users(id) ON DELETE CASCADE;


-- ----------------------------------------------------------------------------
-- 12. Verify
-- ----------------------------------------------------------------------------

SELECT relname AS table_name, relrowsecurity AS rls_enabled
  FROM pg_class
 WHERE relnamespace = 'public'::regnamespace
   AND relname IN ('products', 'collections', 'cart_items', 'orders', 'order_items', 'users')
 ORDER BY relname;

SELECT tablename, policyname, cmd, roles
  FROM pg_policies
 WHERE schemaname = 'public'
 ORDER BY tablename, policyname;
