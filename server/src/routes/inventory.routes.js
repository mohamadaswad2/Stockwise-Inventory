/**
 * Inventory routes.
 *
 * PERUBAHAN: Buang POST/DELETE categories — user hanya boleh GET categories.
 * Categories diset oleh admin melalui seed.js sahaja.
 *
 * GET    /api/inventory                — list items (paginated)
 * POST   /api/inventory                — create item
 * GET    /api/inventory/:id            — get single item
 * PUT    /api/inventory/:id            — update item
 * DELETE /api/inventory/:id            — soft-delete item
 * GET    /api/inventory/categories     — list global categories (read-only)
 */
const router = require('express').Router();
const inventoryController = require('../controllers/inventory.controller');
const categoryController  = require('../controllers/category.controller');
const { authenticate }    = require('../middlewares/auth.middleware');
const { validate }        = require('../middlewares/validate.middleware');
const { createItem, updateItem, listQuery } = require('../validations/inventory.validation');

router.use(authenticate);

// Categories — GET only, no create/delete for users
router.get('/categories', categoryController.getCategories);

// Items CRUD
router.get('/',      validate(listQuery, 'query'), inventoryController.getItems);
router.post('/',     validate(createItem),          inventoryController.createItem);
router.get('/:id',   inventoryController.getItem);
router.put('/:id',   validate(updateItem),          inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

module.exports = router;
