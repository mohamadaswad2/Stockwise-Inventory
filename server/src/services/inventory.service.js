const inventoryRepository = require('../repositories/inventory.repository');
const categoryRepository  = require('../repositories/category.repository');
const { query }           = require('../config/database');
const AppError = require('../utils/AppError');

const EXPORT_LIMITS = { free: 0, starter: 3, premium: 6, deluxe: Infinity };

const getItems   = async (userId, q) => inventoryRepository.findAll({ userId, ...q });
const getItem    = async (id, userId) => {
  const item = await inventoryRepository.findById(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const createItem = async (userId, data) => {
  if (data.category_id) {
    const cat = await categoryRepository.findGlobalById(data.category_id);
    if (!cat) throw new AppError('Category not found.', 404);
  }
  if (!data.sku || data.sku.trim() === '') data.sku = null;
  return inventoryRepository.create(userId, data);
};

const updateItem = async (id, userId, data) => {
  if (data.sku !== undefined && (!data.sku || data.sku.trim() === '')) data.sku = null;
  const item = await inventoryRepository.update(id, userId, data);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const deleteItem = async (id, userId) => {
  const item = await inventoryRepository.remove(id, userId);
  if (!item) throw new AppError('Item not found.', 404);
  return item;
};

const quickSell = async (userId, itemId, quantity) => {
  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1.', 400);
  return inventoryRepository.quickSell(userId, itemId, quantity);
};

// Restock endpoint
const restockItem = async (userId, itemId, { quantity, cost_price, note }) => {
  if (!quantity || quantity < 1) throw new AppError('Quantity must be at least 1.', 400);
  return inventoryRepository.restock(userId, itemId, quantity, cost_price, note);
};

const exportCSV = async (userId, userPlan) => {
  const limit = EXPORT_LIMITS[userPlan] ?? 0;
  if (limit === 0) throw new AppError('CSV export requires Starter plan or above.', 403);

  if (limit !== Infinity) {
    const countRes = await query(
      `SELECT COUNT(*) FROM csv_exports WHERE user_id=$1 AND exported_at > DATE_TRUNC('month',NOW())`,
      [userId]
    );
    const used = parseInt(countRes.rows[0].count);
    if (used >= limit)
      throw new AppError(`Export limit reached (${used}/${limit} this month). Upgrade for more.`, 429);
  }

  const items = await inventoryRepository.findAllForExport(userId);
  await query(`INSERT INTO csv_exports (user_id) VALUES ($1)`, [userId]);

  const headers = ['Name','SKU','Description','Quantity','Unit',
    'Sell Price (MYR)','Cost Price (MYR)','Low Stock Threshold','Category','Status','Created','Updated'];
  const escape = v => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return (s.includes(',') || s.includes('"') || s.includes('\n')) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const rows = items.map(i => [
    escape(i.name), escape(i.sku), escape(i.description), i.quantity, escape(i.unit),
    Number(i.price).toFixed(2), Number(i.cost_price).toFixed(2), i.low_stock_threshold,
    escape(i.category), escape(i.status),
    new Date(i.created_at).toLocaleDateString('en-MY'),
    new Date(i.updated_at).toLocaleDateString('en-MY'),
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
};

const getExportQuota = async (userId, userPlan) => {
  const limit = EXPORT_LIMITS[userPlan] ?? 0;
  if (limit === Infinity) return { used: 0, limit: 'Unlimited', remaining: 'Unlimited' };
  if (limit === 0) return { used: 0, limit: 0, remaining: 0 };
  const res = await query(
    `SELECT COUNT(*) FROM csv_exports WHERE user_id=$1 AND exported_at > DATE_TRUNC('month',NOW())`,
    [userId]
  );
  const used = parseInt(res.rows[0].count);
  return { used, limit, remaining: Math.max(0, limit - used) };
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, quickSell, restockItem, exportCSV, getExportQuota };
