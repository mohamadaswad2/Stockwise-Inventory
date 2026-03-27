/**
 * JWT authentication middleware.
 * Verifies the Bearer token and attaches the decoded user to req.user.
 */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/user.repository');

const authenticate = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Re-fetch user to ensure account is still active
    const user = await userRepository.findById(decoded.id);
    if (!user || !user.is_active) {
      throw new AppError('User not found or account disabled.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
