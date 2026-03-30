const router = require('express').Router();
const inventoryController = require('../controllers/inventory.controller');
const categoryController  = require('../controllers/category.controller');
const { authenticate, requireUnlocked } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createItem, updateItem, listQuery } = require('../validations/inventory.validation');

router.use(authenticate);

// Categories — GET only (categories are global, managed by admin via seed)
router.get('/categories', categoryController.getCategories);

// CSV Export — must be before /:id routes
router.get('/export/csv', inventoryController.exportCSV);

// Items CRUD
router.get('/',       validate(listQuery, 'query'), inventoryController.getItems);
router.post('/',      requireUnlocked, validate(createItem), inventoryController.createItem);
router.get('/:id',    inventoryController.getItem);
router.put('/:id',    requireUnlocked, validate(updateItem), inventoryController.updateItem);
router.delete('/:id', requireUnlocked, inventoryController.deleteItem);

// Quick sell
router.post('/:id/quick-sell', requireUnlocked, inventoryController.quickSell);

module.exports = router;
