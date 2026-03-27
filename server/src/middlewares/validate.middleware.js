/**
 * Request validation middleware factory using Joi.
 * FIXED: Log validation errors properly untuk debugging.
 */
const { error: errorResponse } = require('../utils/response');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,  // reject unknown fields
      stripUnknown: true,   // strip unknown fields sebelum pass ke controller
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field:   d.context?.key || d.path?.join('.'),
        message: d.message.replace(/"/g, ''),
        value:   d.context?.value,
      }));

      // Log untuk debugging
      console.error('[Validate] FAILED on', req.method, req.originalUrl);
      console.error('[Validate] Source:', source, JSON.stringify(req[source]));
      console.error('[Validate] Errors:', JSON.stringify(errors));

      return errorResponse(res, 'Validation failed', 422, errors);
    }

    // Replace req[source] dengan validated + coerced values
    req[source] = value;
    next();
  };
};

module.exports = { validate };
