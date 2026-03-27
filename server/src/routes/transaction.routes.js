const router = require('express').Router();
const txController = require('../controllers/transaction.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.post('/',        txController.record);
router.get('/',         txController.list);
router.get('/summary',  txController.summary);

module.exports = router;