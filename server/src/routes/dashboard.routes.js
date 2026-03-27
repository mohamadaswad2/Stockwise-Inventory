/**
 * Dashboard routes.
 * GET /api/dashboard/stats
 */
const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/stats', authenticate, dashboardController.getStats);

module.exports = router;
