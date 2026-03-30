const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkLowStock } = require('../utils/alertScheduler');
const { query } = require('../config/database');
const { sendLowStockAlert } = require('../utils/email');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

router.use(authenticate);
router.get('/me',   userController.getMe);
router.patch('/me', userController.updateMe);

// Manual low stock check — user triggers from Settings
router.post('/alert/low-stock', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Free users cannot get alerts
    if (req.user.plan === 'free') {
      throw new AppError('Low stock alerts require a paid plan.', 403);
    }

    const result = await query(`
      SELECT name, sku, quantity, unit, low_stock_threshold
      FROM inventory_items
      WHERE user_id = $1 AND is_active = TRUE AND quantity <= low_stock_threshold
      ORDER BY quantity ASC LIMIT 20
    `, [userId]);

    if (result.rows.length === 0) {
      return success(res, { count: 0 }, 'All items are well-stocked! No alert needed.');
    }

    await sendLowStockAlert(req.user.email, req.user.name, result.rows.map(r => ({
      name: r.name, sku: r.sku, quantity: r.quantity,
      unit: r.unit, threshold: r.low_stock_threshold,
    })));

    success(res, { count: result.rows.length },
      `Alert sent! ${result.rows.length} low stock item${result.rows.length !== 1 ? 's' : ''} reported.`);
  } catch (err) { next(err); }
});

module.exports = router;
