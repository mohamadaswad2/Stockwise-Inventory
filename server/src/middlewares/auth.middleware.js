const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      throw new AppError('Access denied. No token provided.', 401);

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await userRepository.findById(decoded.id);

    if (!user || !user.is_active) throw new AppError('User not found or account disabled.', 401);
    req.user = user;
    next();
  } catch (err) { next(err); }
};

const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin')
    return next(new AppError('Admin access required.', 403));
  next();
};

const requireVerified = (req, _res, next) => {
  if (!req.user?.is_email_verified)
    return next(new AppError('Please verify your email first.', 403));
  next();
};

module.exports = { authenticate, requireAdmin, requireVerified };
