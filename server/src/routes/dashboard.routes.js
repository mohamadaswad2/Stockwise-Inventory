const router = require('express').Router();
const c      = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.get('/', c.getStats);

module.exports = router;
