const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.use(authenticate, requireAdmin);
router.get('/stats',              adminController.getStats);
router.get('/users',              adminController.getUsers);
router.patch('/users/:id/toggle-lock', adminController.toggleLock);

module.exports = router;
