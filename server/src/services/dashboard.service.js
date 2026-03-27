/**
 * Dashboard service — aggregated stats for the authenticated user.
 */
const inventoryRepository = require('../repositories/inventory.repository');

const getStats = async (userId) => {
  const [stats, lowStockItems] = await Promise.all([
    inventoryRepository.getDashboardStats(userId),
    inventoryRepository.getLowStockItems(userId, 10),
  ]);

  return {
    total_items:       parseInt(stats.total_items),
    total_quantity:    parseInt(stats.total_quantity),
    total_value:       parseFloat(stats.total_value).toFixed(2),
    low_stock_count:   parseInt(stats.low_stock_count),
    out_of_stock_count:parseInt(stats.out_of_stock_count),
    low_stock_items:   lowStockItems,
  };
};

module.exports = { getStats };
