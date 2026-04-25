/**
 * Dashboard service — aggregated stats + stock trend + categories.
 */
const inventoryRepository = require('../repositories/inventory.repository');

const getStats = async (userId) => {
  const [stats, lowStockItems, stockTrend, categoryBreakdown] = await Promise.all([
    inventoryRepository.getDashboardStats(userId),
    inventoryRepository.getLowStockItems(userId, 10),
    inventoryRepository.getStockTrend(userId),
    inventoryRepository.getCategoryBreakdown(userId),
  ]);

  return {
    total_items:        parseInt(stats.total_items       || 0),
    total_quantity:     parseInt(stats.total_quantity    || 0),
    total_value:        parseFloat(stats.total_value     || 0).toFixed(2),
    low_stock_count:    parseInt(stats.low_stock_count   || 0),
    out_of_stock_count: parseInt(stats.out_of_stock_count|| 0),
    low_stock_items:    lowStockItems,
    stock_trend:        stockTrend,
    category_breakdown: categoryBreakdown,
  };
};

module.exports = { getStats };
