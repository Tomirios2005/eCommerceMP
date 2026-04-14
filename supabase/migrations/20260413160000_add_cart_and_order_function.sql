/*
  # Cart Items + create_order_with_stock

  1. cart_items — persists per-user shopping cart in DB
  2. create_order_with_stock — atomic RPC: validates stock, creates order + items, decrements stock
*/

-- ─── CART ITEMS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid    NOT NULL REFERENCES auth.users(id)  ON DELETE CASCADE,
  product_id  uuid    NOT NULL REFERENCES products(id)    ON DELETE CASCADE,
  quantity    integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, product_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own cart
CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id);

-- ─── create_order_with_stock ──────────────────────────────────────────────────
--
-- Atomically:
--   1. Validates the caller is p_user_id
--   2. Locks product rows and checks stock for every item
--   3. Inserts the order + order_items
--   4. Decrements product stock
--   5. Returns the new order id
--
-- Raises EXCEPTION (mapped to Supabase error.message) on:
--   - Unauthorized call
--   - Empty cart
--   - Product not found / inactive
--   - Insufficient stock

CREATE OR REPLACE FUNCTION create_order_with_stock(
  p_user_id     uuid,
  p_total       numeric,
  p_subtotal    numeric,
  p_shipping_cost numeric,
  p_address     jsonb,
  p_items       jsonb        -- array of {product_id, product_name, product_image, quantity, unit_price, total_price}
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id  uuid;
  v_item      jsonb;
  v_stock     integer;
  v_len       integer;
  i           integer;
BEGIN
  -- Security: caller must be the order owner
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  v_len := jsonb_array_length(p_items);
  IF v_len = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío';
  END IF;

  -- ── Phase 1: validate stock (lock rows to prevent race conditions) ──────────
  FOR i IN 0 .. (v_len - 1) LOOP
    v_item := p_items -> i;

    SELECT stock INTO v_stock
    FROM   products
    WHERE  id        = (v_item->>'product_id')::uuid
      AND  is_active = true
    FOR UPDATE;               -- row-level lock

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Producto no disponible: %',
        COALESCE(v_item->>'product_name', 'desconocido');
    END IF;

    IF v_stock < (v_item->>'quantity')::integer THEN
      RAISE EXCEPTION 'Stock insuficiente para "%" (disponible: %, solicitado: %)',
        v_item->>'product_name',
        v_stock,
        (v_item->>'quantity')::integer;
    END IF;
  END LOOP;

  -- ── Phase 2: create order ──────────────────────────────────────────────────
  INSERT INTO orders (user_id, status, total, subtotal, shipping_cost, shipping_address)
  VALUES (p_user_id, 'pending', p_total, p_subtotal, p_shipping_cost, p_address)
  RETURNING id INTO v_order_id;

  -- ── Phase 3: insert items + decrement stock ────────────────────────────────
  FOR i IN 0 .. (v_len - 1) LOOP
    v_item := p_items -> i;

    INSERT INTO order_items (
      order_id,    product_id,
      product_name, product_image,
      quantity,    unit_price,   total_price
    ) VALUES (
      v_order_id,
      (v_item->>'product_id')::uuid,
      v_item->>'product_name',
      COALESCE(v_item->>'product_image', ''),
      (v_item->>'quantity')::integer,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );

    UPDATE products
    SET    stock      = stock - (v_item->>'quantity')::integer,
           updated_at = now()
    WHERE  id = (v_item->>'product_id')::uuid;
  END LOOP;

  RETURN v_order_id;
END;
$$;
