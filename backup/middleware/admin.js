const prisma = require('../prisma');

/**
 * Admin middleware – requires auth middleware to run first.
 * Checks that the authenticated user has role='admin' in the profiles table.
 */
async function admin(req, res, next) {
  try {
    const profile = await prisma.profiles.findUnique({
      where: { id: req.user.id },
    });
    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.profile = profile;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = admin;
