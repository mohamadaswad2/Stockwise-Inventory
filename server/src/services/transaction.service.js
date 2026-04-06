const transactionRepo = require('../repositories/transaction.repository');
const inventoryRepo   = require('../repositories/inventory.repository');
const AppError = require('../utils/AppError');

const ANALYTICS_PLANS  = ['premium', 'deluxe'];
const VALID_PERIODS    = ['today','7d','1m','2m','3m','year'];
const ADVANCED_PERIODS = ['2m','3m','year'];

const recordTransaction = async (userId, data) => {
  const { itemId, type, quantity } = data;
  const item = await inventoryRepo.findById(itemId, userId);
  if (!item) throw new AppError('Item not found.', 404);
  if ((type === 'sale' || type === 'usage') && item.quantity < quantity)
    throw new AppError(`Insufficient stock. Available: ${item.quantity} ${item.unit}.`, 400);

  return transactionRepo.create(userId, {
    itemId,
    type,
    quantity,
    unitPrice: data.unitPrice ?? item.price,
    costPrice: data.costPrice ?? item.cost_price ?? 0,
    note:      data.note,
  });
};

const getTransactions = (userId, query) => transactionRepo.findAll(userId, query);

const getSalesSummary = (userId, period = '1m') =>
  transactionRepo.getSalesSummary(userId, period);

const getTopItems = (userId, period = '1m') =>
  transactionRepo.getTopItems(userId, period);

const getRevenueTrend = (userId, period = '1m') =>
  transactionRepo.getRevenueTrend(userId, period);

const getAnalytics = async (userId, userPlan, period = '1m') => {
  const isAdvanced = ANALYTICS_PLANS.includes(userPlan);

  if (!VALID_PERIODS.includes(period))
    throw new AppError('Invalid period.', 400);

  if (ADVANCED_PERIODS.includes(period) && !isAdvanced)
    throw new AppError('Extended analytics require Premium or Deluxe plan.', 403);

  const [summary, trend, topItems] = await Promise.all([
    transactionRepo.getSalesSummary(userId, period),
    transactionRepo.getRevenueTrend(userId, period),
    transactionRepo.getTopItems(userId, period, 20),
  ]);

  return { summary, trend, topItems, period, isAdvanced };
};

const getItemAnalytics = async (userId, itemId, period = '1m') =>
  transactionRepo.getItemSalesHistory(userId, itemId, period);

module.exports = {
  recordTransaction, getTransactions,
  getSalesSummary, getTopItems, getRevenueTrend,
  getAnalytics, getItemAnalytics,
};
