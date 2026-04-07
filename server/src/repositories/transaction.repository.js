const db = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// PERIOD FILTER
// period = 'today' → dari 00:00 hari ini (DATE_TRUNC bukan rolling 24h)
// period = '7d'    → 7 hari rolling
// alias  = table prefix untuk JOIN queries (e.g. 't')
// ─────────────────────────────────────────────────────────────────────────────
const periodFilter = (period, alias = '') => {
  const col = alias ? `${alias}.created_at` : 'created_at';
  if (period === 'today') {
    return `${col} >= DATE_TRUNC('day', NOW())`;
  }
  const map = {
    '7d': '7 days', '1m': '30 days',
    '2m': '60 days', '3m': '90 days', 'year': '365 days',
  };
  return `${col} > NOW() - INTERVAL '${map[period] || '30 days'}'`;
};

const periodToDays = (period) => {
  const map = { 'today': 0, '7d': 7, '1m': 30, '2m': 60, '3m': 90, 'year': 365 };
  return map[period] ?? 30;
};

// ─────────────────────────────────────────────────────────────────────────────
// COST-ONLY: unit_price=0 → revenue=0, profit=0, cost dikira seperti biasa
// ─────────────────────────────────────────────────────────────────────────────

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
      `UPDATE inventory_items
       SET quantity = GREATEST(0, quantity + $1), updated_at = NOW()
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

const findAll = async (userId, { page = 1, limit = 20, type, itemId, dateFrom, dateTo } = {}) => {
  const offset = (page - 1) * limit;
  const conds  = ['t.user_id = $1'];
  const vals   = [userId];
  let i = 2;
  if (type)     { conds.push(`t.type = $${i++}`);        vals.push(type); }
  if (itemId)   { conds.push(`t.item_id = $${i++}`);     vals.push(itemId); }
  if (dateFrom) { conds.push(`t.created_at >= $${i++}`); vals.push(dateFrom); }
  if (dateTo)   { conds.push(`t.created_at <= $${i++}`); vals.push(dateTo); }
  const where = conds.join(' AND ');

  const [countRes, rowRes] = await Promise.all([
    db.query(`SELECT COUNT(*) FROM transactions t WHERE ${where}`, vals),
    db.query(
      `SELECT
         t.id, t.user_id, t.item_id, t.type,
         t.quantity, t.unit_price, t.cost_price, t.note, t.created_at,
         (t.quantity * t.unit_price) AS total,
         CASE WHEN t.unit_price > 0
           THEN t.quantity * (t.unit_price - t.cost_price)
           ELSE 0
         END AS profit,
         i.name AS item_name, i.sku, i.unit
       FROM transactions t
       JOIN inventory_items i ON i.id = t.item_id
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, limit, offset]
    ),
  ]);
  return { transactions: rowRes.rows, total: parseInt(countRes.rows[0].count), page, limit };
};

// ─────────────────────────────────────────────────────────────────────────────
// getSalesSummary — single table, no JOIN
// ─────────────────────────────────────────────────────────────────────────────
const getSalesSummary = async (userId, period = '1m') => {
  const filterPeriod = periodFilter(period);
  const filter30d    = `created_at > NOW() - INTERVAL '30 days'`;
  const filter7d     = `created_at > NOW() - INTERVAL '7 days'`;

  const { rows } = await db.query(`
    SELECT
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale'), 0)                             AS total_revenue,
      COALESCE(SUM(quantity)
        FILTER (WHERE type = 'sale'), 0)                             AS total_units_sold,
      COUNT(*) FILTER (WHERE type = 'sale')                          AS total_transactions,

      -- period metrics
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS revenue_period,
      COALESCE(SUM(CASE WHEN unit_price > 0
          THEN quantity * (unit_price - cost_price) ELSE 0 END)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS profit_period,
      COALESCE(SUM(quantity * cost_price)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS cost_period,

      -- fixed reference
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale' AND ${filter30d}), 0)            AS revenue_30d,
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale' AND ${filter7d}), 0)             AS revenue_7d
    FROM transactions
    WHERE user_id = $1
  `, [userId]);

  return rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// getRevenueTrend — single table, no JOIN
//
// FIX: Use subquery to compute bucket first, then GROUP BY bucket.
//      This avoids "column must appear in GROUP BY" error on PostgreSQL/Supabase.
//
// Today  → bucket per HOUR  → 00:00 .. 23:00 (24 slots filled)
// 7d/1m  → bucket per DAY   → filled with 0 for missing days
// 2m/3m/year → bucket per WEEK → sparse (actual rows only)
// ─────────────────────────────────────────────────────────────────────────────
const getRevenueTrend = async (userId, period = '1m') => {
  const isToday = period === 'today';
  const isWeek  = ['2m', '3m', 'year'].includes(period);
  const truncBy = isToday ? 'hour' : isWeek ? 'week' : 'day';
  const filter  = periodFilter(period); // no alias — single table

  // Use subquery so GROUP BY references the computed bucket alias cleanly
  const { rows } = await db.query(`
    SELECT
      bucket,
      COALESCE(SUM(revenue), 0)      AS revenue,
      COALESCE(SUM(profit),  0)      AS profit,
      COALESCE(SUM(cost),    0)      AS cost,
      COALESCE(SUM(tx_count), 0)     AS transactions
    FROM (
      SELECT
        DATE_TRUNC('${truncBy}', created_at) AS bucket,
        CASE WHEN type = 'sale' THEN quantity * unit_price      ELSE 0 END AS revenue,
        CASE WHEN type = 'sale' AND unit_price > 0
          THEN quantity * (unit_price - cost_price)             ELSE 0 END AS profit,
        CASE WHEN type = 'sale' THEN quantity * cost_price      ELSE 0 END AS cost,
        CASE WHEN type = 'sale' THEN 1                          ELSE 0 END AS tx_count
      FROM transactions
      WHERE user_id = $1 AND ${filter}
    ) sub
    GROUP BY bucket
    ORDER BY bucket ASC
  `, [userId]);

  // Build lookup map: bucket ISO string → row
  const dataMap = {};
  for (const row of rows) {
    const b   = row.bucket; // Date object from pg driver
    const key = b instanceof Date ? b.toISOString() : String(b);
    dataMap[key.slice(0, isToday ? 16 : 10)] = {
      revenue:      Math.max(0, parseFloat(row.revenue)      || 0),
      profit:       Math.max(0, parseFloat(row.profit)       || 0),
      cost:         Math.max(0, parseFloat(row.cost)         || 0),
      transactions: Math.max(0, parseInt(row.transactions)   || 0),
    };
  }

  const filled = [];
  const now    = new Date();

  if (isToday) {
    // Fill all 24 hours: 00:00 → 23:00
    // Use PostgreSQL NOW() timezone — get current hour via UTC offset awareness
    // We fill ALL 24 hours so chart always has full day context
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      // Lookup key uses UTC date + hour since pg returns UTC
      const todayUTC = now.toISOString().slice(0, 10);
      const key      = `${todayUTC}T${String(h).padStart(2, '0')}`;
      const entry    = dataMap[key] || dataMap[`${todayUTC} ${String(h).padStart(2, '0')}`];
      filled.push({
        date: label,
        revenue:      entry?.revenue      ?? 0,
        profit:       entry?.profit       ?? 0,
        cost:         entry?.cost         ?? 0,
        transactions: entry?.transactions ?? 0,
      });
    }
  } else if (!isWeek) {
    // Daily fill — days days back
    const days = periodToDays(period);
    for (let d = days - 1; d >= 0; d--) {
      const dt  = new Date(now);
      dt.setUTCDate(dt.getUTCDate() - d);
      const key = dt.toISOString().slice(0, 10);
      filled.push({
        date:         key,
        revenue:      dataMap[key]?.revenue      ?? 0,
        profit:       dataMap[key]?.profit       ?? 0,
        cost:         dataMap[key]?.cost         ?? 0,
        transactions: dataMap[key]?.transactions ?? 0,
      });
    }
  } else {
    // Weekly — use actual rows as-is
    for (const row of rows) {
      const b   = row.bucket;
      const key = b instanceof Date ? b.toISOString().slice(0, 10) : String(b).slice(0, 10);
      filled.push({
        date:         key,
        revenue:      Math.max(0, parseFloat(row.revenue)    || 0),
        profit:       Math.max(0, parseFloat(row.profit)     || 0),
        cost:         Math.max(0, parseFloat(row.cost)       || 0),
        transactions: Math.max(0, parseInt(row.transactions) || 0),
      });
    }
    // Ensure min 2 points for chart
    while (filled.length < 2) {
      filled.push({ date: '', revenue: 0, profit: 0, cost: 0, transactions: 0 });
    }
  }

  return filled;
};

// ─────────────────────────────────────────────────────────────────────────────
// getTopItems — JOIN present → alias 't' required
// ─────────────────────────────────────────────────────────────────────────────
const getTopItems = async (userId, period = '1m', limit = 20) => {
  const filter = periodFilter(period, 't');

  const { rows } = await db.query(`
    SELECT
      i.id, i.name, i.sku, i.unit, i.price, i.cost_price,
      SUM(t.quantity)                                              AS units_sold,
      SUM(t.quantity * t.unit_price)                               AS revenue,
      SUM(t.quantity * t.cost_price)                               AS total_cost,
      SUM(CASE WHEN t.unit_price > 0
            THEN t.quantity * (t.unit_price - t.cost_price)
            ELSE 0 END)                                            AS profit,
      CASE WHEN SUM(t.quantity * t.unit_price) > 0
        THEN ROUND(
          SUM(CASE WHEN t.unit_price > 0
                THEN t.quantity * (t.unit_price - t.cost_price)
                ELSE 0 END)
          / SUM(t.quantity * t.unit_price) * 100, 1)
        ELSE 0
      END                                                          AS margin_pct
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1
      AND t.type = 'sale'
      AND ${filter}
    GROUP BY i.id, i.name, i.sku, i.unit, i.price, i.cost_price
    ORDER BY revenue DESC
    LIMIT $2
  `, [userId, limit]);

  return rows;
};

// ─────────────────────────────────────────────────────────────────────────────
// getItemSalesHistory — JOIN present → alias 't' required
// ─────────────────────────────────────────────────────────────────────────────
const getItemSalesHistory = async (userId, itemId, period = '1m') => {
  const filter = periodFilter(period, 't');

  const { rows } = await db.query(`
    SELECT
      t.id, t.quantity, t.unit_price, t.cost_price,
      (t.quantity * t.unit_price)                          AS total,
      CASE WHEN t.unit_price > 0
        THEN t.quantity * (t.unit_price - t.cost_price)
        ELSE 0 END                                         AS profit,
      t.note, t.created_at, i.name AS item_name, i.unit
    FROM transactions t
    JOIN inventory_items i ON i.id = t.item_id
    WHERE t.user_id = $1
      AND t.item_id = $2
      AND t.type = 'sale'
      AND ${filter}
    ORDER BY t.created_at DESC
  `, [userId, itemId]);

  return rows;
};

module.exports = {
  create, findAll,
  getSalesSummary, getRevenueTrend,
  getTopItems, getItemSalesHistory,
};
