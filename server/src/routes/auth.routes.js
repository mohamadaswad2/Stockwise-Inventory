const router    = require('express').Router();
const rateLimit = require('express-rate-limit');
const c         = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate }     = require('../middlewares/validate.middleware');
const Joi              = require('joi');

// Strict rate limit for register — prevents spam account creation
// 5 attempts per IP per 15 minutes
const registerLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many registration attempts. Please try again in 15 minutes.' },
  keyGenerator:    (req) => req.ip,
});

// Moderate limit for login — 20 per 15 min per IP
const loginLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             20,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { success: false, message: 'Too many login attempts. Please wait and try again.' },
  keyGenerator:    (req) => req.ip,
});

const registerSchema = Joi.object({
  name:         Joi.string().min(2).max(100).required(),
  email:        Joi.string().email().required(),
  password:     Joi.string().min(8).max(128)
    .pattern(/^\S+$/,      'no spaces')
    .pattern(/[A-Z]/,      'uppercase')
    .pattern(/[a-z]/,      'lowercase')
    .pattern(/[0-9]/,      'number')
    .pattern(/[^A-Za-z0-9]/, 'symbol')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one {{#name}} character',
    }),
  captchaToken: Joi.string().optional().allow('', null),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetSchema = Joi.object({
  email:       Joi.string().email().required(),
  token:       Joi.string().required(),
  newPassword: Joi.string().min(8).max(128)
    .pattern(/^\S+$/, 'no spaces').required(),
});

router.post('/register',             registerLimiter, validate(registerSchema),  c.register);
router.post('/verify-email',                                    c.verifyEmail);
router.post('/resend-verification',                             c.resendVerification);
router.post('/login',                loginLimiter, validate(loginSchema),     c.login);
router.post('/forgot-password',      validate(forgotSchema),    c.forgotPassword);
router.post('/reset-password',       validate(resetSchema),     c.resetPassword);
router.post('/logout',               authenticate,              c.logout);
router.get('/profile',               authenticate,              c.getProfile);
router.post('/change-password',      authenticate,              c.changePassword);

module.exports = router;
