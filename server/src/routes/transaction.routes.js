const router = require('express').Router();
const c      = require('../controllers/transaction.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.post('/',                 c.record);
router.get('/',                  c.list);
router.get('/summary',           c.summary);
router.get('/analytics',         c.analytics);
router.get('/analytics/:itemId', c.itemAnalytics);

module.exports = router;
