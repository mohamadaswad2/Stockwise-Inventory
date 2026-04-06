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
const getSalesSummary    = (userId, period) => transactionRepo.getSalesSummary(userId, period);
const getTopItems        = (userId, period) => transactionRepo.getTopItems(userId, period);
const getRevenueTrend    = (userId, period) => transactionRepo.getRevenueTrend(userId, period);

// Analytics for Analytics page - reuse existing functions
const getAnalytics = async (userId, period = '1m') => {
  const [sales, topItems, trend] = await Promise.all([
    getSalesSummary(userId, period),
    getTopItems(userId, period),
    getRevenueTrend(userId, period)
  ]);
  
  // Transform to match frontend expectation
  const summary = {
    revenue_period: sales.revenue_period || 0,
    profit_period: sales.profit_period || 0,
    cost_period: sales.cost_period || 0,
    total_transactions: sales.total_transactions || 0
  };
  
  return { summary, topItems, trend };
};

module.exports = { recordTransaction, getTransactions, getSalesSummary, getTopItems, getRevenueTrend, getAnalytics };
