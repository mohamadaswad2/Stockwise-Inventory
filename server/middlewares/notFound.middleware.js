/**
 * middlewares/notFound.middleware.js
 * Catches any request that didn't match a defined route.
 */

const AppError = require('../utils/AppError');

function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

module.exports = { notFound };
