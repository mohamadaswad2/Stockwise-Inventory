/**
 * middlewares/validate.middleware.js — Request Validation
 *
 * A middleware factory that accepts a Joi schema and validates
 * req.body against it, returning 422 on failure.
 *
 * Usage:
 *   router.post('/register', validate(registerSchema), authController.register);
 */

const { errorResponse } = require('../utils/apiResponse');

/**
 * @param {import('joi').ObjectSchema} schema - Joi schema for req.body
 */
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,   // collect ALL errors, not just the first
      stripUnknown: true,  // remove fields not defined in schema
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.context?.key || 'unknown',
        message: d.message.replace(/['"]/g, ''),
      }));
      return errorResponse(res, 'Validation failed', 422, errors);
    }

    // Replace req.body with the sanitised, validated value
    req.body = value;
    next();
  };
}

module.exports = { validate };
