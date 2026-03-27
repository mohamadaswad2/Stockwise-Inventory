/**
 * User (profile) routes.
 * GET   /api/users/me
 * PATCH /api/users/me
 */
const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/me',   userController.getMe);
router.patch('/me', userController.updateMe);

module.exports = router;
