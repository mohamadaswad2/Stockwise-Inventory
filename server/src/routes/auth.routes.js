/**
 * Auth routes.
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/logout
 * GET  /api/auth/profile
 */
const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { register: registerSchema, login: loginSchema } = require('../validations/auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/logout',   authenticate,             authController.logout);
router.get('/profile',   authenticate,             authController.getProfile);

module.exports = router;
