const db = require('../config/database');

const findAll = async ({ userId, page = 1, limit = 20, search = '', categoryId, lowStock }) => {
  const offset = (page - 1) * limit;
  const conditions = ['i.user_id = $1', 'i.is_active = TRUE'];
  const values = [userId];
  let idx = 2;

  if (search) {
    conditions.push(`(i.name ILIKE $${idx} OR i.sku ILIKE $${idx})`);
    values.push(`%${search}%`); idx++;
  }
  if (categoryId) { conditions.push(`i.category_id = $${idx++}`); values.push(categoryId); }
  if (lowStock === true || lowStock === 'true') {
    conditions.push(`i.quantity <= i.low_stock_threshold`);
  }

  const where = conditions.join(' AND ');
  const countResult = await db.query(`SELECT COUNT(*) FROM inventory_items i WHERE ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const itemResult = await db.query(
    `SELECT i.*, c.name AS category_name
     FROM inventory_items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE ${where}
     ORDER BY i.created_at DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...values, limit, offset]
  );

  return { items: itemResult.rows, total, page, limit };
};

// Export ALL items (no pagination) for CSV
const findAllForExport = async (userId) => {
  const result = await db.query(
    `SELECT
       i.name, i.sku, i.description, i.quantity, i.unit,
       i.price, i.cost_price, i.low_stock_threshold,
       c.name AS category,
       CASE WHEN i.quantity = 0 THEN 'Out of Stock'
            WHEN i.quantity <= i.low_stock_threshold THEN 'Low Stock'
            ELSE 'In Stock' END AS status,
       i.created_at, i.updated_at
     FROM inventory_items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE i.user_id = $1 AND i.is_active = TRUE
     ORDER BY i.name ASC`,
    [userId]
  );
  return result.rows;
};

const findById = async (id, userId) => {
  const result = await db.query(
    `SELECT i.*, c.name AS category_name
     FROM inventory_items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1 AND i.user_id = $2`,
    [id, userId]
  );
  return result.rows[0] || null;
};

const create = async (userId, data) => {
  const { name, sku, description, quantity, unit, price, cost_price, low_stock_threshold, category_id } = data;
  const result = await db.query(
    `INSERT INTO inventory_items
       (user_id, name, sku, description, quantity, unit, price, cost_price, low_stock_threshold, category_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [userId, name, sku||null, description||null, quantity, unit||'unit',
     price, cost_price||0, low_stock_threshold??5, category_id||null]
  );
  return result.rows[0];
};

const update = async (id, userId, data) => {
  const allowed = ['name','sku','description','quantity','unit','price','cost_price',
                   'low_stock_threshold','category_id','is_active'];
  const updates = []; const values = []; let idx = 1;
  for (const [key, val] of Object.entries(data)) {
    if (allowed.includes(key)) { updates.push(`${key} = $${idx++}`); values.push(val); }
  }
  if (!updates.length) return null;
  updates.push(`updated_at = NOW()`);
  values.push(id, userId);
  const result = await db.query(
    `UPDATE inventory_items SET ${updates.join(', ')}
     WHERE id = $${idx} AND user_id = $${idx+1} RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

const remove = async (id, userId) => {
  const result = await db.query(
    `UPDATE inventory_items SET is_active = FALSE, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result.rows[0] || null;
};

// Quick sell — deduct stock atomically
const quickSell = async (userId, itemId, quantity) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Check stock and lock row
    const check = await client.query(
      `SELECT id, name, quantity, price, unit, low_stock_threshold
       FROM inventory_items
       WHERE id = $1 AND user_id = $2 AND is_active = TRUE
       FOR UPDATE`,
      [itemId, userId]
    );

    if (!check.rows[0]) throw new Error('Item not found.');
    const item = check.rows[0];
    if (item.quantity < quantity) throw new Error(`Insufficient stock. Available: ${item.quantity} ${item.unit}.`);

    // Deduct stock
    const updated = await client.query(
      `UPDATE inventory_items SET quantity = quantity - $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, quantity, unit, price, low_stock_threshold`,
      [quantity, itemId, userId]
    );

    // Record transaction
    const tx = await client.query(
      `INSERT INTO transactions (user_id, item_id, type, quantity, unit_price, note)
       VALUES ($1, $2, 'sale', $3, $4, 'Quick sell')
       RETURNING *`,
      [userId, itemId, quantity, item.price]
    );

    await client.query('COMMIT');
    return { item: updated.rows[0], transaction: tx.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const getDashboardStats = async (userId) => {
  const result = await db.query(
    `SELECT
       COUNT(*)                                              AS total_items,
       COALESCE(SUM(quantity), 0)                           AS total_quantity,
       COALESCE(SUM(price * quantity), 0)                   AS total_value,
       COUNT(*) FILTER (WHERE quantity <= low_stock_threshold AND quantity > 0) AS low_stock_count,
       COUNT(*) FILTER (WHERE quantity = 0)                 AS out_of_stock_count
     FROM inventory_items
     WHERE user_id = $1 AND is_active = TRUE`,
    [userId]
  );
  return result.rows[0];
};

const getLowStockItems = async (userId, limit = 5) => {
  const result = await db.query(
    `SELECT id, name, sku, quantity, low_stock_threshold, unit
     FROM inventory_items
     WHERE user_id = $1 AND is_active = TRUE AND quantity <= low_stock_threshold
     ORDER BY quantity ASC LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const getStockTrend = async (userId) => {
  const result = await db.query(
    `SELECT DATE(created_at) AS date, COUNT(*) AS items_added, SUM(quantity) AS total_quantity
     FROM inventory_items
     WHERE user_id = $1 AND is_active = TRUE AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY DATE(created_at) ORDER BY date ASC`,
    [userId]
  );
  return result.rows;
};

const getCategoryBreakdown = async (userId) => {
  const result = await db.query(
    `SELECT COALESCE(c.name, 'Uncategorized') AS name,
            COUNT(i.id) AS item_count,
            COALESCE(SUM(i.quantity), 0) AS total_quantity
     FROM inventory_items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE i.user_id = $1 AND i.is_active = TRUE
     GROUP BY c.name ORDER BY total_quantity DESC LIMIT 6`,
    [userId]
  );
  return result.rows;
};

module.exports = {
  findAll, findAllForExport, findById, create, update, remove, quickSell,
  getDashboardStats, getLowStockItems, getStockTrend, getCategoryBreakdown
};
