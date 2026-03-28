const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

// ── Authenticate — verify JWT and attach req.user ────────────────────────────
const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      throw new AppError('Access denied. No token provided.', 401);

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await userRepository.findById(decoded.id);

    if (!user || !user.is_active)
      throw new AppError('User not found or account disabled.', 401);

    req.user = user;
    next();
  } catch (err) { next(err); }
};

// ── requireAdmin — only admin role ───────────────────────────────────────────
const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin')
    return next(new AppError('Admin access required.', 403));
  next();
};

// ── requireVerified — email must be verified ─────────────────────────────────
const requireVerified = (req, _res, next) => {
  if (!req.user?.is_email_verified)
    return next(new AppError('Please verify your email first.', 403));
  next();
};

// ── requireUnlocked — account must not be locked (subscription active) ───────
// This was MISSING — caused silent crash on inventory routes
const requireUnlocked = (req, _res, next) => {
  if (req.user?.is_locked)
    return next(new AppError('Your account is locked. Please renew your subscription.', 402));
  next();
};

module.exports = { authenticate, requireAdmin, requireVerified, requireUnlocked };
