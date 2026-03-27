/**
 * utils/AppError.js — Custom Application Error
 *
 * Extends the native Error so we can attach an HTTP status code and
 * a flag to distinguish operational errors (safe to expose to clients)
 * from programming errors (which should be masked).
 */

class AppError extends Error {
  /**
   * @param {string} message     - Human-readable error message
   * @param {number} statusCode  - HTTP status code (4xx / 5xx)
   * @param {any}    errors      - Optional validation errors array
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    // "operational" = expected, client-caused errors (4xx);
    // non-operational = unexpected bugs (5xx)
    this.isOperational = statusCode < 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
