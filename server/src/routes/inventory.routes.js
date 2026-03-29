const router = require('express').Router();
const inventoryController = require('../controllers/inventory.controller');
const categoryController  = require('../controllers/category.controller');
const { authenticate, requireUnlocked } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createItem, updateItem, listQuery } = require('../validations/inventory.validation');

router.use(authenticate);

// Categories
router.get('/categories',        categoryController.getCategories);
router.post('/categories',       requireUnlocked, categoryController.createCategory);
router.delete('/categories/:id', requireUnlocked, categoryController.deleteCategory);

// CSV Export (plan-gated in service)
router.get('/export/csv', inventoryController.exportCSV);

// Items
router.get('/',     validate(listQuery, 'query'), inventoryController.getItems);
router.post('/',    requireUnlocked, validate(createItem), inventoryController.createItem);
router.get('/:id',  inventoryController.getItem);
router.put('/:id',  requireUnlocked, validate(updateItem), inventoryController.updateItem);
router.delete('/:id', requireUnlocked, inventoryController.deleteItem);

// Quick sell — simplified transaction
router.post('/:id/quick-sell', requireUnlocked, inventoryController.quickSell);

module.exports = router;
