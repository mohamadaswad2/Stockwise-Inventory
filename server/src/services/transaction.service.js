const transactionRepo = require('../repositories/transaction.repository');
const inventoryRepo   = require('../repositories/inventory.repository');
const AppError = require('../utils/AppError');

const recordTransaction = async (userId, data) => {
  const { itemId, type, quantity } = data;

  // Validate item belongs to user
  const item = await inventoryRepo.findById(itemId, userId);
  if (!item) throw new AppError('Item not found.', 404);

  // For sales/usage: check sufficient stock
  if ((type === 'sale' || type === 'usage') && item.quantity < quantity) {
    throw new AppError(`Insufficient stock. Available: ${item.quantity} ${item.unit}.`, 400);
  }

  const result = await transactionRepo.create(userId, {
    itemId,
    type,
    quantity,
    unitPrice: data.unitPrice ?? item.price,
    note:      data.note,
  });

  return result;
};

const getTransactions    = (userId, query) => transactionRepo.findAll(userId, query);
const getSalesSummary    = (userId)         => transactionRepo.getSalesSummary(userId);
const getTopItems        = (userId)         => transactionRepo.getTopItems(userId);
const getRevenueTrend    = (userId, days)   => transactionRepo.getRevenueTrend(userId, days);

module.exports = { recordTransaction, getTransactions, getSalesSummary, getTopItems, getRevenueTrend };
