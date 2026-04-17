const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const { normalizeCartItem } = require('../lib/serialize');

// ── GET /api/cart – Load user cart ────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const items = await prisma.cart_items.findMany({
      where: { user_id: req.user.id },
      include: { products: true },
    });
    res.json(items.map(normalizeCartItem));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/cart/sync – Bulk upsert local items on login ───────────────────
// Must be declared before POST / to prevent conflict in some routers.
router.post('/sync', auth, async (req, res) => {
  try {
    const { items } = req.body; // [{ product_id, quantity }]
    if (!Array.isArray(items) || items.length === 0) return res.json({ ok: true });

    await Promise.all(
      items.map(item =>
        prisma.cart_items.upsert({
          where: {
            user_id_product_id: { user_id: req.user.id, product_id: item.product_id },
          },
          update: { quantity: item.quantity, updated_at: new Date() },
          create: { user_id: req.user.id, product_id: item.product_id, quantity: item.quantity },
        })
      )
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/cart – Upsert single item (sets absolute quantity) ──────────────
router.post('/', auth, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    if (!product_id || quantity === undefined) {
      return res.status(400).json({ error: 'product_id and quantity required' });
    }

    const item = await prisma.cart_items.upsert({
      where: { user_id_product_id: { user_id: req.user.id, product_id } },
      update: { quantity, updated_at: new Date() },
      create: { user_id: req.user.id, product_id, quantity },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/cart/:productId – Update quantity ──────────────────────────────
router.patch('/:productId', auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await prisma.cart_items.update({
      where: {
        user_id_product_id: { user_id: req.user.id, product_id: req.params.productId },
      },
      data: { quantity, updated_at: new Date() },
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/cart – Clear entire cart ──────────────────────────────────────
router.delete('/', auth, async (req, res) => {
  try {
    await prisma.cart_items.deleteMany({ where: { user_id: req.user.id } });
    res.json({ message: 'Carrito limpiado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/cart/:productId – Remove single item ─────────────────────────
router.delete('/:productId', auth, async (req, res) => {
  try {
    await prisma.cart_items.delete({
      where: {
        user_id_product_id: { user_id: req.user.id, product_id: req.params.productId },
      },
    });
    res.json({ message: 'Item eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
