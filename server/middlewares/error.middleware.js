/**
 * middlewares/error.middleware.js — Centralised Error Handler
 *
 * Must be registered LAST in Express (after all routes) so it can
 * catch errors forwarded via next(err).
 *
 * Handles:
 *   - AppError instances (operational, known status codes)
 *   - JWT errors (invalid / expired tokens)
 *   - PostgreSQL errors (unique constraint, foreign key, etc.)
 *   - Generic / unexpected errors
 */

const AppError = require('../utils/AppError');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Transform known library errors into AppErrors before responding.
 */
function normalizeError(err) {
  // ── JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return new AppError('Your session has expired. Please log in again.', 401);
  }

  // ── PostgreSQL errors
  if (err.code === '23505') {
    // Unique constraint violation — extract field name from detail
    const match = err.detail?.match(/Key \((.+?)\)=/);
    const field = match ? match[1] : 'field';
    return new AppError(`A record with this ${field} already exists.`, 409);
  }
  if (err.code === '23503') {
    return new AppError('Referenced record does not exist.', 400);
  }
  if (err.code === '22P02') {
    return new AppError('Invalid UUID format.', 400);
  }

  // ── CORS policy error (set in app.js)
  if (err.message && err.message.startsWith('CORS policy')) {
    return new AppError(err.message, 403);
  }

  return err;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalised = normalizeError(err);

  // Operational error — safe to reveal message to client
  if (normalised instanceof AppError) {
    return errorResponse(res, normalised.message, normalised.statusCode, normalised.errors);
  }

  // Unexpected / programming error — log full details, hide from client
  console.error('💥 Unexpected error:', err);

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again later.'
      : err.message,
    500
  );
}

module.exports = { errorHandler };
