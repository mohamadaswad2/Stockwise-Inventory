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
    success(res, null, 'Item deleted.');
  } catch (err) { next(err); }
};

// Quick sell — simplified one-click stock deduction
const quickSell = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const result = await inventoryService.quickSell(req.user.id, req.params.id, Number(quantity));
    success(res, result, `Sold ${quantity} unit(s). Stock updated.`);
  } catch (err) { next(err); }
};

// CSV export — returns CSV file
const exportCSV = async (req, res, next) => {
  try {
    const csv = await inventoryService.exportCSV(req.user.id, req.user.plan);
    const filename = `stockwise-inventory-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) { next(err); }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, quickSell, exportCSV };
