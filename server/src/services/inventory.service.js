const inventoryRepository = require('../repositories/inventory.repository');
const categoryRepository  = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

const EXPORT_ALLOWED_PLANS = ['starter', 'premium', 'deluxe'];

const getItems = async (userId, query) => {
  return inventoryRepository.findAll({ userId, ...query });
};

const getItem = async (id, userId) => {
  const item = await inventoryRepository.findById(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const createItem = async (userId, data) => {
  if (data.category_id) {
    const cat = await categoryRepository.findGlobalById(data.category_id);
    if (!cat) throw new AppError('Category not found.', 404);
  }
  return inventoryRepository.create(userId, data);
};

const updateItem = async (id, userId, data) => {
  const item = await inventoryRepository.update(id, userId, data);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const deleteItem = async (id, userId) => {
  const item = await inventoryRepository.remove(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

// Quick sell — simplified transaction
const quickSell = async (userId, itemId, quantity) => {
  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1.', 400);
  return inventoryRepository.quickSell(userId, itemId, quantity);
};

// CSV export — gated by plan
const exportCSV = async (userId, userPlan) => {
  if (!EXPORT_ALLOWED_PLANS.includes(userPlan)) {
    throw new AppError('CSV export requires Starter, Premium or Deluxe plan.', 403);
  }

  const items = await inventoryRepository.findAllForExport(userId);

  // Build CSV string
  const headers = [
    'Name', 'SKU', 'Description', 'Quantity', 'Unit',
    'Sell Price (MYR)', 'Cost Price (MYR)', 'Low Stock Threshold',
    'Category', 'Status', 'Created At', 'Updated At'
  ];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    // Wrap in quotes if contains comma, quote, or newline
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = items.map(item => [
    escape(item.name),
    escape(item.sku),
    escape(item.description),
    item.quantity,
    escape(item.unit),
    Number(item.price).toFixed(2),
    Number(item.cost_price).toFixed(2),
    item.low_stock_threshold,
    escape(item.category),
    escape(item.status),
    new Date(item.created_at).toLocaleDateString('en-MY'),
    new Date(item.updated_at).toLocaleDateString('en-MY'),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, quickSell, exportCSV };
