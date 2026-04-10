const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const Joi = require('joi');

const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).max(128)
    .pattern(/[A-Z]/).pattern(/[a-z]/).pattern(/[0-9]/).pattern(/[^A-Za-z0-9]/)
    .required(),
});
const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

router.post('/register',             validate(registerSchema), c.register);
router.post('/verify-email',         c.verifyEmail);
router.post('/resend-verification',  c.resendVerification);
router.post('/login',                validate(loginSchema), c.login);
router.post('/forgot-password',      c.forgotPassword);
router.post('/reset-password',       c.resetPassword);
router.post('/logout',               authenticate, c.logout);
router.get('/profile',               authenticate, c.getProfile);
router.post('/change-password',      authenticate, c.changePassword);

module.exports = router;
