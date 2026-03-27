const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const Joi = require('joi');

const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).max(128)
    .pattern(/[A-Z]/, 'uppercase')
    .pattern(/[a-z]/, 'lowercase')
    .pattern(/[0-9]/, 'number')
    .pattern(/[^A-Za-z0-9]/, 'symbol')
    .required()
    .messages({
      'string.pattern.name': 'Password must contain at least one {{#name}} character',
    }),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register',            validate(registerSchema),                          authController.register);
router.post('/verify-email',        authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/login',               validate(loginSchema),                             authController.login);
router.post('/logout',              authenticate,                                      authController.logout);
router.get('/profile',              authenticate,                                      authController.getProfile);
router.post('/change-password',     authenticate,                                      authController.changePassword);

module.exports = router;
