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
const getSalesSummary    = (userId, period = '1m') => transactionRepo.getSalesSummary(userId, period);
const getTopItems        = (userId, period = '1m') => transactionRepo.getTopItems(userId, period);
const getRevenueTrend    = (userId, period = '1m') => transactionRepo.getRevenueTrend(userId, period);

const getAnalytics = async (userId, period = '1m') => {
  const [summary, topItems, trend] = await Promise.all([
    getSalesSummary(userId, period),
    getTopItems(userId, period),
    getRevenueTrend(userId, period),
  ]);
  
  return {
    summary,
    topItems,
    trend,
  };
};

module.exports = { recordTransaction, getTransactions, getSalesSummary, getTopItems, getRevenueTrend, getAnalytics };
