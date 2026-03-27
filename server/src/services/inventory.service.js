/**
 * Inventory service — business logic untuk inventory items.
 *
 * PERUBAHAN: Category validation sekarang semak global categories sahaja.
 * User tidak boleh create/delete categories.
 */
const inventoryRepository = require('../repositories/inventory.repository');
const categoryRepository  = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

const getItems = async (userId, query) => {
  return inventoryRepository.findAll({ userId, ...query });
};

const getItem = async (id, userId) => {
  const item = await inventoryRepository.findById(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const createItem = async (userId, data) => {
  // Kalau ada category_id, semak ia adalah global category yang valid
  if (data.category_id) {
    const cat = await categoryRepository.findGlobalById(data.category_id);
    if (!cat) throw new AppError('Category not found.', 404);
  }
  return inventoryRepository.create(userId, data);
};

const updateItem = async (id, userId, data) => {
  if (data.category_id) {
    const cat = await categoryRepository.findGlobalById(data.category_id);
    if (!cat) throw new AppError('Category not found.', 404);
  }
  const item = await inventoryRepository.update(id, userId, data);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const deleteItem = async (id, userId) => {
  const item = await inventoryRepository.remove(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
