const inventoryRepository = require('../repositories/inventory.repository');

const getStats = async (userId) => {
  const [stats, lowStockItems, stockTrend, categoryBreakdown] = await Promise.all([
    inventoryRepository.getDashboardStats(userId),
    inventoryRepository.getLowStockItems(userId, 10),
    inventoryRepository.getStockTrend(userId),
    inventoryRepository.getCategoryBreakdown(userId),
  ]);

  return {
    stats,
    low_stock_items: lowStockItems,
    stock_trend: stockTrend,
    category_breakdown: categoryBreakdown,
  };
};

module.exports = { getStats };
