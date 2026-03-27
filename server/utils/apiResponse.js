/**
 * utils/apiResponse.js — Consistent API Response Helpers
 *
 * Every response from this API follows the same envelope:
 *   { success: boolean, message: string, data?: any, meta?: any }
 *
 * This ensures the frontend can always handle responses uniformly.
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {object} options
 * @param {any}    options.data     - Payload to return
 * @param {string} options.message  - Human-readable message
 * @param {number} options.status   - HTTP status code (default 200)
 * @param {object} options.meta     - Pagination / extra metadata
 */
function successResponse(res, { data = null, message = 'Success', status = 200, meta = null } = {}) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(status).json(body);
}

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message   - Error description
 * @param {number} status    - HTTP status code (default 500)
 * @param {any}    errors    - Validation error details (optional)
 */
function errorResponse(res, message = 'Internal Server Error', status = 500, errors = null) {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(status).json(body);
}

module.exports = { successResponse, errorResponse };
