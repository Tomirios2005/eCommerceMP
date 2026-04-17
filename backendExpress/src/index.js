require('dotenv').config();
const express = require('express');
const cors = require('cors');

const productRoutes  = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const cartRoutes     = require('./routes/cart');
const orderRoutes    = require('./routes/orders');
const paymentRoutes  = require('./routes/payments');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/products',   productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/payments',   paymentRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Express corriendo en puerto ${PORT}`);
});
