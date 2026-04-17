const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * POST /api/payments/create-preference
 *
 * Proxies the request to the Supabase Edge Function that creates
 * a Mercado Pago preference, forwarding the user's Bearer token.
 */
router.post('/create-preference', auth, async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    const userAuth = req.headers.authorization; // "Bearer <token>"

    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-mercadopago-preference`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: userAuth,
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
