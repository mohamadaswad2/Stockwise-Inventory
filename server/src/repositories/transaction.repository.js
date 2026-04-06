const db = require('../config/database');

const periodToInterval = (period) => {
  const map = { 
    '1h':'1 hour','24h':'24 hours','7d':'7 days','1m':'30 days','2m':'60 days','3m':'90 days','year':'365 days' 
  };
  return map[period] || '30 days';
};

const periodToDays = (period) => {
  const map = { '1h':0.04,'24h':1,'7d':7,'1m':30,'2m':60,'3m':90,'year':365 };
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
    const delta = (type === 'sale' || type === 'usage') ? -Math.abs(quantity) : Math.abs(quantity);
    const itemRes = await client.query(
      `UPDATE inventory_items SET quantity = GREATEST(0, quantity + $1), updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, quantity, low_stock_threshold, unit`,
      [delta, itemId, userId]
    );
    if (!itemRes.rows[0]) throw new Error('Item not found.');
    await client.query('COMMIT');
    return { transaction: txRes.rows[0], item: itemRes.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally { client.release(); }
};

const findAll = async (userId, { page = 1, limit = 20, type, itemId, dateFrom, dateTo }) => {
  const offset = (page - 1) * limit;
  const conds = ['t.user_id = $1']; const vals = [userId]; let i = 2;
  if (type)     { conds.push(`t.type = $${i++}`);        vals.push(type); }
  if (itemId)   { conds.push(`t.item_id = $${i++}`);     vals.push(itemId); }
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
       FROM transactions t JOIN inventory_items i ON i.id = t.item_id
       WHERE ${where} ORDER BY t.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...vals, limit, offset]
    ),
  ]);
  return { transactions: rowRes.rows, total: parseInt(countRes.rows[0].count), page, limit };
};

const getSalesSummary = async (userId, period = '1m') => {
  const interval = periodToInterval(period);
  const result = await db.query(`
    SELECT
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale'), 0)   AS total_revenue,
      COALESCE(SUM(quantity)              FILTER (WHERE type='sale'), 0)   AS total_units_sold,
      COUNT(*)                            FILTER (WHERE type='sale')       AS total_transactions,
      COALESCE(SUM(quantity * (unit_price - cost_price)) FILTER (WHERE type='sale'), 0) AS total_profit,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS revenue_period,
      COALESCE(SUM(quantity * (unit_price - cost_price)) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS profit_period,
      COALESCE(SUM(quantity * cost_price) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '${interval}'), 0) AS cost_period,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '30 days'), 0) AS revenue_30d,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '7 days'), 0) AS revenue_7d,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type='sale' AND created_at > NOW()-INTERVAL '24 hours'), 0) AS revenue_24h
    FROM transactions WHERE user_id = $1`, [userId]
  );
  return result.rows[0];
};

const getRevenueTrend = async (userId, period = '1m') => {
  const interval = periodToInterval(period);
  const days     = periodToDays(period);
  
  // Use appropriate grouping based on period
  let groupBy, dateFormat, dataPoints;
  
  if (period === '1h') {
    groupBy = "DATE_TRUNC('hour', created_at)";
    dateFormat = 'YYYY-MM-DD HH24:MI:SS';
    dataPoints = 12;
  } else if (['24h', '7d', '1m'].includes(period)) {
    groupBy = "DATE_TRUNC('day', created_at)";
    dateFormat = 'YYYY-MM-DD';
    dataPoints = period === '24h' ? 24 : (period === '7d' ? 7 : 30);
  } else {
    groupBy = "DATE_TRUNC('week', created_at)";
    dateFormat = 'YYYY-MM-DD';
    dataPoints = Math.floor(days / 7);
  }

  // Query actual data
  const result = await db.query(`
    SELECT
      TO_CHAR(${groupBy}, '${dateFormat}') AS date,
      COALESCE(SUM(quantity * unit_price)              FILTER (WHERE type='sale'), 0) AS revenue,
      COALESCE(SUM(quantity * (unit_price-cost_price)) FILTER (WHERE type='sale'), 0) AS profit,
      COALESCE(SUM(quantity * cost_price)              FILTER (WHERE type='sale'), 0) AS cost,
      COUNT(*) FILTER (WHERE type='sale') AS transactions
    FROM transactions
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${interval}'
    GROUP BY ${groupBy}
    ORDER BY ${groupBy} ASC`, [userId]
  );

  // Build a complete date/time series — fill missing dates with 0
  const dataMap = {};
  for (const row of result.rows) {
    const key = row.date;
    dataMap[key] = {
      date:         key,
      revenue:      Math.max(0, parseFloat(row.revenue)     || 0),
      profit:       parseFloat(row.profit)                  || 0, // profit can be negative
      cost:         Math.max(0, parseFloat(row.cost)        || 0),
      transactions: parseInt(row.transactions)              || 0,
    };
  }

  // Generate full date/time range
  const filled = [];
  const now    = new Date();

  if (period === '1h') {
    // Generate 5-minute intervals for the last hour
    for (let i = 11; i >= 0; i--) {
      const dt = new Date(now);
      dt.setMinutes(dt.getMinutes() - (i * 5));
      dt.setSeconds(0, 0); // Round to minute
      const key = dt.toISOString().slice(0, 16).replace('T', ' '); // YYYY-MM-DD HH:MI
      filled.push(dataMap[key] || {
        date: key, revenue: 0, profit: 0, cost: 0, transactions: 0,
      });
    }
  } else if (['24h', '7d', '1m'].includes(period)) {
    for (let d = dataPoints - 1; d >= 0; d--) {
      const dt  = new Date(now);
      dt.setDate(dt.getDate() - d);
      dt.setHours(0, 0, 0, 0); // Round to day
      const key = dt.toISOString().slice(0, 10); // YYYY-MM-DD
      filled.push(dataMap[key] || {
        date: key, revenue: 0, profit: 0, cost: 0, transactions: 0,
      });
    }
  } else {
    // For week grouping — use actual query results
    for (const row of result.rows) {
      filled.push(dataMap[row.date]);
    }
  }

  return filled;
};

const getTopItems = async (userId, period = '1m', limit = 20) => {
  const interval = periodToInterval(period);
  const result = await db.query(`
    SELECT
      i.id, i.name, i.sku, i.unit, i.price, i.cost_price,
      SUM(t.quantity)                                  AS units_sold,
      SUM(t.quantity * t.unit_price)                   AS revenue,
      SUM(t.quantity * t.cost_price)                   AS total_cost,
      SUM(t.quantity * (t.unit_price - t.cost_price))  AS profit,
      CASE WHEN SUM(t.quantity * t.unit_price) > 0
        THEN ROUND((SUM(t.quantity*(t.unit_price-t.cost_price)) / SUM(t.quantity*t.unit_price))*100, 1)
        ELSE 0 END AS margin_pct
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1 AND t.type = 'sale'
      AND t.created_at > NOW() - INTERVAL '${interval}'
    GROUP BY i.id, i.name, i.sku, i.unit, i.price, i.cost_price
    ORDER BY revenue DESC
    LIMIT $2`, [userId, limit]
  );
  return result.rows;
};

const getItemSalesHistory = async (userId, itemId, period = '1m') => {
  const interval = periodToInterval(period);
  const result = await db.query(`
    SELECT t.id, t.quantity, t.unit_price, t.cost_price,
      (t.quantity * t.unit_price)               AS total,
      (t.quantity * (t.unit_price-t.cost_price)) AS profit,
      t.note, t.created_at, i.name AS item_name, i.unit
    FROM transactions t JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1 AND t.item_id = $2 AND t.type = 'sale'
      AND t.created_at > NOW() - INTERVAL '${interval}'
    ORDER BY t.created_at DESC`, [userId, itemId]
  );
  return result.rows;
};

module.exports = { create, findAll, getSalesSummary, getRevenueTrend, getTopItems, getItemSalesHistory };
