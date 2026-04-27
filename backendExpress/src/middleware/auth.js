const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY
);

async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role ?? 'user' // opcional, si manejás roles
    };

    next();
  } catch (err) {
    res.status(500).json({ message: 'Auth middleware error', details: err.message });
  }
}

module.exports = auth;