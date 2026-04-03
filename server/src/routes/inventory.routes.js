const router = require('express').Router();
const c   = require('../controllers/inventory.controller');
const cat = require('../controllers/category.controller');
const { authenticate, requireUnlocked } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createItem, updateItem, listQuery } = require('../validations/inventory.validation');

router.use(authenticate);
router.get('/categories',        cat.getCategories);
router.get('/export/csv',        c.exportCSV);
router.get('/export/quota',      c.getExportQuota);
router.get('/',                  validate(listQuery, 'query'), c.getItems);
router.post('/',                 requireUnlocked, validate(createItem), c.createItem);
router.get('/:id',               c.getItem);
router.put('/:id',               requireUnlocked, validate(updateItem), c.updateItem);
router.delete('/:id',            requireUnlocked, c.deleteItem);
router.post('/:id/quick-sell',   requireUnlocked, c.quickSell);
router.post('/:id/restock',      requireUnlocked, c.restockItem);
module.exports = router;
