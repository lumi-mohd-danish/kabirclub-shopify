-- Add size column to cart_items table if it doesn't exist
-- Run this in Supabase SQL Editor to add the column to existing database
--
-- Without this column the shopper's selected size is dropped between the
-- product page and the order, and every order_items row is recorded as 'M'.

-- Add size column with default value
ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'M';

-- Backfill existing cart rows so no line is left without a size
UPDATE cart_items
SET size = 'M'
WHERE size IS NULL;

-- A cart line is identified by product + session + size, so the column must be set
ALTER TABLE cart_items
ALTER COLUMN size SET NOT NULL;

-- Create index for better performance on cart lookups by product/session/size
CREATE INDEX IF NOT EXISTS idx_cart_items_product_session_size
  ON cart_items(product_id, session_id, size);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN cart_items.size IS 'Size the shopper selected for this cart line (S, M, L, XL, XXL)';
