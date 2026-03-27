const db = require('../config/database');

const create = async (userId, { itemId, type, quantity, unitPrice, note }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Insert transaction
    const txRes = await client.query(
      `INSERT INTO transactions (user_id, item_id, type, quantity, unit_price, note)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, itemId, type, quantity, unitPrice || 0, note || null]
    );

    // Auto-adjust stock based on type
    const delta = (type === 'sale' || type === 'usage') ? -Math.abs(quantity) : Math.abs(quantity);
    const itemRes = await client.query(
      `UPDATE inventory_items
       SET quantity = GREATEST(0, quantity + $1), updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, quantity, low_stock_threshold`,
      [delta, itemId, userId]
    );

    if (!itemRes.rows[0]) throw new Error('Item not found or access denied.');

    await client.query('COMMIT');
    return { transaction: txRes.rows[0], item: itemRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findAll = async (userId, { page = 1, limit = 20, type, itemId, dateFrom, dateTo }) => {
  const offset = (page - 1) * limit;
  const conds  = ['t.user_id = $1'];
  const vals   = [userId];
  let   i      = 2;

  if (type)     { conds.push(`t.type = $${i++}`);       vals.push(type); }
  if (itemId)   { conds.push(`t.item_id = $${i++}`);    vals.push(itemId); }
  if (dateFrom) { conds.push(`t.created_at >= $${i++}`);vals.push(dateFrom); }
  if (dateTo)   { conds.push(`t.created_at <= $${i++}`);vals.push(dateTo); }

  const where = conds.join(' AND ');

  const [countRes, rowRes] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, vals),
    db.query(
      `SELECT t.*, i.name AS item_name, i.sku, i.unit
       FROM transactions t
       JOIN inventory_items i ON i.id = t.item_id
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    ),
  ]);

  return { transactions: rowRes.rows, total: parseInt(countRes.rows[0].count), page, limit };
};

const getSalesSummary = async (userId) => {
  const result = await db.query(`
    SELECT
      COALESCE(SUM(total) FILTER (WHERE type='sale'), 0)                          AS total_revenue,
      COALESCE(SUM(quantity) FILTER (WHERE type='sale'), 0)                       AS total_units_sold,
      COUNT(*) FILTER (WHERE type='sale')                                         AS total_transactions,
      COALESCE(SUM(total) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '30 days'),0) AS revenue_30d,
      COALESCE(SUM(total) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '7 days'),0)  AS revenue_7d
    FROM transactions WHERE user_id = $1`, [userId]
  );
  return result.rows[0];
};

const getTopItems = async (userId, limit = 5) => {
  const result = await db.query(`
    SELECT i.id, i.name, i.sku, i.unit,
           SUM(t.quantity) AS units_sold,
           SUM(t.total)    AS revenue
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1 AND t.type = 'sale'
    GROUP BY i.id, i.name, i.sku, i.unit
    ORDER BY revenue DESC
    LIMIT $2`, [userId, limit]
  );
  return result.rows;
};

const getRevenueTrend = async (userId, days = 30) => {
  const result = await db.query(`
    SELECT DATE(created_at) AS date, SUM(total) AS revenue, SUM(quantity) AS units
    FROM transactions
    WHERE user_id = $1 AND type = 'sale' AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC`, [userId]
  );
  return result.rows;
};

module.exports = { create, findAll, getSalesSummary, getTopItems, getRevenueTrend };