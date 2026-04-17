/**
 * Converts Prisma Decimal objects to plain numbers for JSON serialization.
 */
function serializeDecimal(data) {
  return JSON.parse(
    JSON.stringify(data, (_, value) => {
      if (
        value !== null &&
        typeof value === 'object' &&
        value.constructor?.name === 'Decimal'
      ) {
        return parseFloat(value.toString());
      }
      return value;
    })
  );
}

/**
 * Normalizes a Prisma product record to match the Supabase response shape.
 * Renames: categories → category, product_images → images
 */
function normalizeProduct(p) {
  const { categories, product_images, ...rest } = p;
  return serializeDecimal({
    ...rest,
    category: categories ?? null,
    images: product_images ?? [],
  });
}

/**
 * Normalizes a Prisma order record to match the Supabase response shape.
 * Renames: order_items → items
 */
function normalizeOrder(o) {
  const { order_items, ...rest } = o;
  return serializeDecimal({
    ...rest,
    items: order_items ?? [],
  });
}

/**
 * Normalizes a Prisma cart item to { quantity, product } shape.
 */
function normalizeCartItem(ci) {
  return serializeDecimal({
    quantity: ci.quantity,
    product: ci.products ?? null,
  });
}

module.exports = { serializeDecimal, normalizeProduct, normalizeOrder, normalizeCartItem };
