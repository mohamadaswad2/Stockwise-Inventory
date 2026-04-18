const inventoryRepo = require('../repositories/inventory.repository');

const getStats = async (userId) => {
  const [stats, lowStockItems, categoryBreakdown] = await Promise.all([
    inventoryRepo.getDashboardStats(userId),
    inventoryRepo.getLowStockItems(userId, 10),
    inventoryRepo.getCategoryBreakdown(userId),
  ]);

  return {
    total_items:        parseInt(stats.total_items       || 0),
    total_quantity:     parseInt(stats.total_quantity    || 0),
    total_value:        parseFloat(stats.total_value     || 0).toFixed(2),
    low_stock_count:    parseInt(stats.low_stock_count   || 0),
    out_of_stock_count: parseInt(stats.out_of_stock_count|| 0),
    low_stock_items:    lowStockItems,
    category_breakdown: categoryBreakdown,
  };
};

module.exports = { getStats };
