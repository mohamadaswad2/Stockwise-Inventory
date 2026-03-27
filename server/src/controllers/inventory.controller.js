/**
 * Inventory controller — CRUD endpoints for inventory items.
 */
const inventoryService = require('../services/inventory.service');
const { success, created } = require('../utils/response');

const getItems = async (req, res, next) => {
  try {
    const result = await inventoryService.getItems(req.user.id, req.query);
    success(res, result);
  } catch (err) { next(err); }
};

const getItem = async (req, res, next) => {
  try {
    const item = await inventoryService.getItem(req.params.id, req.user.id);
    success(res, { item });
  } catch (err) { next(err); }
};

const createItem = async (req, res, next) => {
  try {
    const item = await inventoryService.createItem(req.user.id, req.body);
    created(res, { item }, 'Item created successfully.');
  } catch (err) { next(err); }
};

const updateItem = async (req, res, next) => {
  try {
    const item = await inventoryService.updateItem(req.params.id, req.user.id, req.body);
    success(res, { item }, 'Item updated successfully.');
  } catch (err) { next(err); }
};

const deleteItem = async (req, res, next) => {
  try {
    await inventoryService.deleteItem(req.params.id, req.user.id);
    success(res, null, 'Item deleted successfully.');
  } catch (err) { next(err); }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
