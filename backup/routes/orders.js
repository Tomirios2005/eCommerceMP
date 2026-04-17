const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { normalizeOrder } = require('../lib/serialize');

// ── GET /api/orders/admin – Admin: list all orders ───────────────────────────
// Must be declared before /:id to prevent "admin" matching as an order ID.
router.get('/admin', auth, admin, async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/orders – User: list own orders ───────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { user_id: req.user.id },
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    });
    res.json(orders.map(normalizeOrder));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/orders/checkout – Atomic order creation from items ──────────────
router.post('/checkout', auth, async (req, res) => {
  const userId = req.user.id;
  const { total, subtotal, shipping_cost, address, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Carrito vacío' });
  }

  try {
    const orderId = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for every item
      for (const item of items) {
        const product = await tx.products.findUnique({ where: { id: item.product_id } });
        if (!product) throw new Error(`Producto no encontrado: ${item.product_name}`);
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para: ${product.name}`);
        }
      }

      // 2. Create the order
      const order = await tx.orders.create({
        data: {
          user_id: userId,
          total,
          subtotal,
          shipping_cost: shipping_cost ?? 0,
          shipping_address: address ?? {},
          status: 'pending',
        },
      });

      // 3. Create order items + decrement stock
      for (const item of items) {
        await tx.order_items.create({
          data: {
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name,
            product_image: item.product_image ?? '',
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          },
        });

        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 4. Clear the user's cart
      await tx.cart_items.deleteMany({ where: { user_id: userId } });

      return order.id;
    });

    // Return just the order ID (same as supabase.rpc returns)
    res.json(orderId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/:id/cancel – User cancels own order ────────────────────
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.orders.update({
      where: { id: req.params.id },
      data: { status: 'cancelled', updated_at: new Date() },
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/orders/admin/:id/status – Admin updates order status ───────────
router.patch('/admin/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await prisma.orders.update({
      where: { id: req.params.id },
      data: { status, updated_at: new Date() },
      include: { order_items: true },
    });
    res.json(normalizeOrder(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
