/**
 * Centralized error handling middleware.
 */
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';

  if (err.code === '23505') {
    statusCode = 409;
    message    = 'A record with that value already exists.';
  }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token has expired.'; }

  // LOG full error dalam development untuk debug
  if (process.env.NODE_ENV === 'development') {
    console.error('[ERROR]', req.method, req.originalUrl);
    console.error('[ERROR] Message:', err.message);
    console.error('[ERROR] Body:', JSON.stringify(req.body));
    console.error('[ERROR] Query:', JSON.stringify(req.query));
    if (err.details) console.error('[ERROR] Validation:', JSON.stringify(err.details));
  }

  const response = { success: false, message };
  if (process.env.NODE_ENV === 'development') {
    response.debug = { body: req.body, query: req.query };
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
