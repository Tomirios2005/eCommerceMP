const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { normalizeProduct } = require('../lib/serialize');

// ── GET /api/products – Public: active products with optional filters ─────────
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const where = { is_active: true };
    if (category) where.category_id = category;
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const products = await prisma.products.findMany({
      where,
      include: { categories: true, product_images: true },
      orderBy: { created_at: 'desc' },
    });

    res.json(products.map(normalizeProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/admin – Admin: all products ────────────────────────────
// Must be declared before /:slug to prevent "admin" being matched as a slug.
router.get('/admin', auth, admin, async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const products = await prisma.products.findMany({
      where,
      include: { categories: true },
      orderBy: { created_at: 'desc' },
    });

    res.json(products.map(normalizeProduct));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/id/:id – Single product by ID ──────────────────────────
router.get('/id/:id', async (req, res) => {
  try {
    const product = await prisma.products.findUnique({
      where: { id: req.params.id },
      include: { categories: true, product_images: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/products – Create product (admin) ───────────────────────────────
router.post('/', auth, admin, async (req, res) => {
  try {
    const { name, slug, description, price, compare_price, stock, sku, main_image, category_id, is_active } = req.body;
    const product = await prisma.products.create({
      data: {
        name,
        slug,
        description: description ?? '',
        price: price ?? 0,
        compare_price: compare_price ?? null,
        stock: stock ?? 0,
        sku: sku ?? '',
        main_image: main_image ?? '',
        category_id: category_id || null,
        is_active: is_active ?? true,
      },
      include: { categories: true },
    });
    res.status(201).json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT /api/products/:id – Update product (admin) ───────────────────────────
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const { name, slug, description, price, compare_price, stock, sku, main_image, category_id, is_active } = req.body;
    const product = await prisma.products.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        price,
        compare_price: compare_price ?? null,
        stock,
        sku,
        main_image,
        category_id: category_id || null,
        is_active,
        updated_at: new Date(),
      },
      include: { categories: true },
    });
    res.json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/products/:id – Delete product (admin) ────────────────────────
router.delete('/:id', auth, admin, async (req, res) => {
  try {
    await prisma.products.delete({ where: { id: req.params.id } });
    res.json({ message: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/products/:id/toggle – Toggle is_active (admin) ────────────────
router.patch('/:id/toggle', auth, admin, async (req, res) => {
  try {
    const current = await prisma.products.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Product not found' });

    const product = await prisma.products.update({
      where: { id: req.params.id },
      data: { is_active: !current.is_active, updated_at: new Date() },
      include: { categories: true },
    });
    res.json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/products/:slug – Single product by slug (public, MUST be last) ──
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.products.findFirst({
      where: { slug: req.params.slug, is_active: true },
      include: { categories: true, product_images: true },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(normalizeProduct(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
