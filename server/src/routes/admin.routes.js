const router = require('express').Router();
const adminController     = require('../controllers/admin.controller');
const appUpdateController = require('../controllers/appUpdate.controller');
const { authenticate, requireAdmin } = require('../middlewares/auth.middleware');

router.use(authenticate, requireAdmin);

// User management
router.get('/stats',                   adminController.getStats);
router.get('/users',                   adminController.getUsers);
router.patch('/users/:id/toggle-lock', adminController.toggleLock);
router.patch('/users/:id/plan',        adminController.updateUserPlan);

// App updates — admin CRUD
router.get('/updates',     appUpdateController.list);
router.post('/updates',    appUpdateController.create);
router.delete('/updates/:id', appUpdateController.remove);

module.exports = router;
