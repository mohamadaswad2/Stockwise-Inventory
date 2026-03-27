/**
 * middlewares/auth.middleware.js — JWT Authentication Guard
 *
 * Verifies the Bearer token in the Authorization header and attaches
 * the decoded user payload to req.user.
 *
 * Usage:
 *   router.use(authenticate);          // protect all routes below
 *   router.get('/me', authenticate, handler);
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const AppError = require('../utils/AppError');
const { userRepository } = require('../repositories/user.repository');

async function authenticate(req, _res, next) {
  try {
    // 1. Extract token from "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify signature and expiry
    const decoded = jwt.verify(token, jwtConfig.secret, jwtConfig.verifyOptions);

    // 3. Confirm the user still exists in the database
    //    (handles the case where an account was deleted after token issuance)
    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError('The user associated with this token no longer exists.', 401);
    }

    // 4. Attach lean user object (no password) to request
    req.user = {
      id:    user.id,
      email: user.email,
      name:  user.name,
      role:  user.role,
      plan:  user.plan,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based access control middleware factory.
 * Usage: authorize('admin')  or  authorize('admin', 'owner')
 */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}

module.exports = { authenticate, authorize };
