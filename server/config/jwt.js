/**
 * config/jwt.js — JWT Configuration
 * Centralises token signing / verification options.
 */

module.exports = {
  secret: process.env.JWT_SECRET || 'changeme_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',

  /** Options passed to jwt.sign() */
  signOptions: {
    algorithm: 'HS256',
  },

  /** Options passed to jwt.verify() */
  verifyOptions: {
    algorithms: ['HS256'],
  },
};
