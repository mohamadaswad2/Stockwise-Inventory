const db = require('../config/database');

const periodToInterval = (period) => {
  const map = {
    '24h': '24 hours',
    '7d': '7 days',
    '1m': '30 days',
    '2m': '60 days',
    '3m': '90 days',
    'year': '365 days'
  };
  return map[period] || '30 days';
};

const periodToDays = (period) => {
  const map = {
    '24h': 1,
    '7d': 7,
    '1m': 30,
    '2m': 60,
    '3m': 90,
    'year': 365
  };
  return map[period] || 30;
};

const create = async (userId, { itemId, type, quantity, unitPrice, costPrice, note }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const txRes = await client.query(
      `INSERT INTO transactions (user_id, item_id, type, quantity, unit_price, cost_price, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [userId, itemId, type, quantity, unitPrice || 0, costPrice || 0, note || null]
    );

    const delta = (type === 'sale' || type === 'usage')
      ? -Math.abs(quantity)
      : Math.abs(quantity);

    const itemRes = await client.query(
      `UPDATE inventory_items 
       SET quantity = GREATEST(0, quantity + $1), updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, quantity, low_stock_threshold, unit`,
      [delta, itemId, userId]
    );

    if (!itemRes.rows[0]) throw new Error('Item not found.');

    await client.query('COMMIT');

    return {
      transaction: txRes.rows[0],
      item: itemRes.rows[0]
    };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const findAll = async (userId, { page = 1, limit = 20, type, itemId, dateFrom, dateTo }) => {
  const offset = (page - 1) * limit;
  const conds = ['t.user_id = $1'];
  const vals = [userId];
  let i = 2;

  if (type)     { conds.push(`t.type = $${i++}`); vals.push(type); }
  if (itemId)   { conds.push(`t.item_id = $${i++}`); vals.push(itemId); }
  if (dateFrom) { conds.push(`t.created_at >= $${i++}`); vals.push(dateFrom); }
  if (dateTo)   { conds.push(`t.created_at <= $${i++}`); vals.push(dateTo); }

  const where = conds.join(' AND ');

  const [countRes, rowRes] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, vals),
    db.query(
      `SELECT t.*,
              (t.quantity * t.unit_price) AS total,
              (t.quantity * (t.unit_price - t.cost_price)) AS profit,
              i.name AS item_name, i.sku, i.unit
       FROM transactions t
       JOIN inventory_items i ON i.id = t.item_id
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    ),
  ]);

  return {
    transactions: rowRes.rows,
    total: parseInt(countRes.rows[0].count),
    page,
    limit
  };
};

const getSalesSummary = async (userId, period = '1m') => {
  const interval = periodToInterval(period);

  const result = await db.query(`
    SELECT
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale'), 0) AS total_revenue,
      COALESCE(SUM(quantity) FILTER (WHERE type='sale'), 0) AS total_units_sold,
      COUNT(*) FILTER (WHERE type='sale') AS total_transactions,

      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS revenue_period,

      COALESCE(SUM(quantity * (unit_price - cost_price))
        FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS profit_period,

      COALESCE(SUM(quantity * cost_price)
        FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS cost_period

    FROM transactions
    WHERE user_id = $1
  `, [userId]);

  return result.rows[0];
};

const getRevenueTrend = async (userId, period = '1m') => {
  const interval = periodToInterval(period);
  const days = periodToDays(period);

  const groupBy =
    period === '24h' ? 'hour'
    : ['7d', '1m'].includes(period) ? 'day'
    : 'week';

  const timeFilter =
    period === '24h'
      ? `created_at >= DATE_TRUNC('day', NOW())`
      : `created_at > NOW() - INTERVAL '${interval}'`;

  const result = await db.query(`
    SELECT
      DATE_TRUNC('${groupBy}', created_at) AS bucket,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale'), 0) AS revenue,
      COALESCE(SUM(quantity * (unit_price - cost_price)) FILTER (WHERE type='sale'), 0) AS profit,
      COALESCE(SUM(quantity * cost_price) FILTER (WHERE type='sale'), 0) AS cost,
      COUNT(*) FILTER (WHERE type='sale') AS transactions
    FROM transactions
    WHERE user_id = $1 AND ${timeFilter}
    GROUP BY bucket
    ORDER BY bucket ASC
  `, [userId]);

  const dataMap = {};

  for (const row of result.rows) {
    let key;

    if (groupBy === 'hour') {
      const d = new Date(row.bucket);
      key = `${d.getHours().toString().padStart(2, '0')}:00`;
    } else {
      key = new Date(row.bucket).toISOString().slice(0, 10);
    }

    dataMap[key] = {
      date: key,
      revenue: Math.max(0, parseFloat(row.revenue) || 0),
      profit: parseFloat(row.profit) || 0,
      cost: Math.max(0, parseFloat(row.cost) || 0),
      transactions: parseInt(row.transactions) || 0,
    };
  }

  const filled = [];
  const now = new Date();

  if (groupBy === 'hour') {
    for (let h = 0; h < 24; h++) {
      const key = `${h.toString().padStart(2, '0')}:00`;

      filled.push(dataMap[key] || {
        date: key,
        revenue: 0,
        profit: 0,
        cost: 0,
        transactions: 0,
      });
    }
  }

  else if (groupBy === 'day') {
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() - d);

      const key = dt.toISOString().slice(0, 10);

      filled.push(dataMap[key] || {
        date: key,
        revenue: 0,
        profit: 0,
        cost: 0,
        transactions: 0,
      });
    }
  }

  else {
    for (const key in dataMap) {
      filled.push(dataMap[key]);
    }
  }

  return filled;
};

const getTopItems = async (userId, period = '1m', limit = 20) => {
  const interval = periodToInterval(period);

  const result = await db.query(`
    SELECT
      i.id, i.name, i.sku, i.unit, i.price, i.cost_price,
      SUM(t.quantity) AS units_sold,
      SUM(t.quantity * t.unit_price) AS revenue,
      SUM(t.quantity * t.cost_price) AS total_cost,
      SUM(t.quantity * (t.unit_price - t.cost_price)) AS profit,
      CASE
        WHEN SUM(t.quantity * t.unit_price) > 0
        THEN ROUND(
          (SUM(t.quantity * (t.unit_price - t.cost_price)) /
          SUM(t.quantity * t.unit_price)) * 100, 1)
        ELSE 0
      END AS margin_pct
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1
      AND t.type = 'sale'
      AND t.created_at > NOW() - INTERVAL '${interval}'
    GROUP BY i.id, i.name, i.sku, i.unit, i.price, i.cost_price
    ORDER BY revenue DESC
    LIMIT $2
  `, [userId, limit]);

  return result.rows;
};

const getItemSalesHistory = async (userId, itemId, period = '1m') => {
  const interval = periodToInterval(period);

  const result = await db.query(`
    SELECT
      t.id, t.quantity, t.unit_price, t.cost_price,
      (t.quantity * t.unit_price) AS total,
      (t.quantity * (t.unit_price - t.cost_price)) AS profit,
      t.note, t.created_at,
      i.name AS item_name, i.unit
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1
      AND t.item_id = $2
      AND t.type = 'sale'
      AND t.created_at > NOW() - INTERVAL '${interval}'
    ORDER BY t.created_at DESC
  `, [userId, itemId]);

  return result.rows;
};

module.exports = {
  create,
  findAll,
  getSalesSummary,
  getRevenueTrend,
  getTopItems,
  getItemSalesHistory
};