/**
 * utils/catchAsync.js — Async Route Handler Wrapper
 *
 * Eliminates repetitive try/catch blocks in controllers.
 * Any thrown error (or rejected promise) is forwarded to
 * Express's next() and caught by the central error handler.
 *
 * Usage:
 *   router.get('/items', catchAsync(inventoryController.getAll));
 */

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
