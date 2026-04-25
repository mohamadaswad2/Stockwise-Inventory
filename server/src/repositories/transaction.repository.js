const db = require('../config/database');

// ─────────────────────────────────────────────────────────────────────────────
// TIMEZONE-AWARE PERIOD FILTER
//
// tz = IANA timezone string e.g. 'Asia/Kuala_Lumpur'
// Default fallback = 'UTC' (safe for any user)
//
// All DATE_TRUNC and NOW() operations use AT TIME ZONE so that:
//   - "Today" = midnight in USER's local time, not server UTC midnight
//   - Hour labels = user local hour (18:00), not UTC hour (10:00)
//   - Day boundaries = user local day, not UTC day
//
// alias = table alias for created_at (needed in JOIN queries)
// ─────────────────────────────────────────────────────────────────────────────
const periodFilter = (period, alias = '', tz = 'UTC') => {
  const col = alias ? `${alias}.created_at` : 'created_at';
  const safeTz = tz || 'UTC';

  if (period === 'today') {
    // Midnight in user local time, expressed back in UTC for comparison
    // DATE_TRUNC('day', NOW() AT TIME ZONE tz) gives local midnight as timestamp without tz
    // AT TIME ZONE tz converts it back to timestamptz for correct comparison with stored UTC
    return `${col} >= DATE_TRUNC('day', NOW() AT TIME ZONE '${safeTz}') AT TIME ZONE '${safeTz}'`;
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
// COST-ONLY: unit_price=0 → revenue=0, profit=0 (not negative), cost tracked
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
// tz passed through for period filter boundary accuracy
// ─────────────────────────────────────────────────────────────────────────────
const getSalesSummary = async (userId, period = '1m', tz = 'UTC') => {
  const filterPeriod = periodFilter(period, '', tz);
  const filter30d    = `created_at > NOW() - INTERVAL '30 days'`;
  const filter7d     = `created_at > NOW() - INTERVAL '7 days'`;

  const { rows } = await db.query(`
    SELECT
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale'), 0)                             AS total_revenue,
      COALESCE(SUM(quantity)
        FILTER (WHERE type = 'sale'), 0)                             AS total_units_sold,
      COUNT(*) FILTER (WHERE type = 'sale')                          AS total_transactions,
      COALESCE(SUM(quantity * unit_price)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS revenue_period,
      COALESCE(SUM(CASE WHEN unit_price > 0
          THEN quantity * (unit_price - cost_price) ELSE 0 END)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS profit_period,
      COALESCE(SUM(quantity * cost_price)
        FILTER (WHERE type = 'sale' AND ${filterPeriod}), 0)         AS cost_period,
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
// TIMEZONE FIX:
//   - All DATE_TRUNC uses AT TIME ZONE tz → correct local day/hour boundaries
//   - TO_CHAR produces local time labels (18:00 not 10:00 for UTC+8 user)
//   - Fill loop uses tz-aware current hour/day calculation
//   - dataMap key uses local time string (13 chars for hour, 10 for day)
// ─────────────────────────────────────────────────────────────────────────────
const getRevenueTrend = async (userId, period = '1m', tz = 'UTC') => {
  const safeTz  = tz || 'UTC';
  const isToday = period === 'today';
  const isWeek  = ['2m', '3m', 'year'].includes(period);
  const truncBy = isToday ? 'hour' : isWeek ? 'week' : 'day';
  const filter  = periodFilter(period, '', safeTz);

  // All DATE_TRUNC operations use user's timezone
  // bucket is in LOCAL time — TO_CHAR outputs local hour labels
  const { rows } = await db.query(`
    SELECT
      bucket,
      COALESCE(SUM(revenue), 0)  AS revenue,
      COALESCE(SUM(profit),  0)  AS profit,
      COALESCE(SUM(cost),    0)  AS cost,
      COALESCE(SUM(tx_count), 0)  AS transactions,
      COALESCE(SUM(qty_added), 0) AS qty_added
    FROM (
      SELECT
        DATE_TRUNC('${truncBy}', created_at AT TIME ZONE '${safeTz}') AS bucket,
        CASE WHEN type = 'sale' THEN quantity * unit_price      ELSE 0 END AS revenue,
        CASE WHEN type = 'sale' AND unit_price > 0
          THEN quantity * (unit_price - cost_price)             ELSE 0 END AS profit,
        CASE WHEN type = 'sale' THEN quantity * cost_price      ELSE 0 END AS cost,
        CASE WHEN type = 'sale' THEN 1                          ELSE 0 END AS tx_count,
        CASE WHEN type IN ('restock','adjustment') AND quantity > 0
          THEN quantity                                         ELSE 0 END AS qty_added
      FROM transactions
      WHERE user_id = $1 AND ${filter}
    ) sub
    GROUP BY bucket
    ORDER BY bucket ASC
  `, [userId]);

  // ── Build dataMap ──────────────────────────────────────────────────────────
  // bucket is now a LOCAL timestamp (no timezone info from pg for timestamp type)
  // We format it as local date/time string for key matching
  const dataMap = {};
  for (const row of rows) {
    const b = row.bucket;
    // pg returns DATE_TRUNC result as timestamp without timezone
    // When AT TIME ZONE used, pg returns it as a plain Date in local time
    // We use toISOString() but interpret it as local (not UTC)
    // Safer: use string representation directly
    let rawStr;
    if (b instanceof Date) {
      // pg timestamp without timezone stored as Date but in UTC container
      // AT TIME ZONE makes it local — pg returns it shifted
      // Key: use the numeric value but format carefully
      rawStr = b.toISOString(); // this will be in UTC representation
    } else {
      rawStr = String(b);
    }

    const key = isToday
      ? rawStr.slice(0, 13)   // 'YYYY-MM-DDTHH' — 13 chars, matches fill loop
      : rawStr.slice(0, 10);  // 'YYYY-MM-DD' — 10 chars

    dataMap[key] = {
      revenue:      Math.max(0, parseFloat(row.revenue)      || 0),
      profit:       Math.max(0, parseFloat(row.profit)       || 0),
      cost:         Math.max(0, parseFloat(row.cost)         || 0),
      transactions: Math.max(0, parseInt(row.transactions)   || 0),
      qty_added:    Math.max(0, parseInt(row.qty_added)      || 0),
    };
  }

  // ── Fill loop — use tz-aware current time ──────────────────────────────────
  const filled = [];
  const nowUTC  = new Date();

  if (isToday) {
    // Get current hour in USER's timezone using Intl API
    const localHourStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: safeTz,
      hour:     '2-digit',
      hour12:   false,
    }).format(nowUTC);
    const currentLocalHour = parseInt(localHourStr, 10);

    // Get today's date string in USER's timezone
    const localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz,
      year:     'numeric',
      month:    '2-digit',
      day:      '2-digit',
    }).format(nowUTC); // returns 'YYYY-MM-DD' format (en-CA locale)

    // Fill all 24 hours — full day context
    for (let h = 0; h < 24; h++) {
      const hourStr  = String(h).padStart(2, '0');
      const label    = `${hourStr}:00`;
      // Key format must match what pg returns for the bucket
      // pg DATE_TRUNC result AT TIME ZONE returns local time
      // When pg driver serializes it, it adds UTC offset
      // Key: localDateStr + 'T' + hourStr (13 chars)
      const key      = `${localDateStr}T${hourStr}`;
      const entry    = dataMap[key];

      filled.push({
        date:         label,
        revenue:      entry?.revenue      ?? 0,
        profit:       entry?.profit       ?? 0,
        cost:         entry?.cost         ?? 0,
        transactions: entry?.transactions ?? 0,
        qty_added:    entry?.qty_added    ?? 0,
        isFuture:     h > currentLocalHour,
      });
    }

  } else if (!isWeek) {
    const days = periodToDays(period);
    // Get today's local date in user timezone
    const localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz,
      year:     'numeric',
      month:    '2-digit',
      day:      '2-digit',
    }).format(nowUTC);

    for (let d = days - 1; d >= 0; d--) {
      // Compute date d days ago in user timezone
      const dt = new Date(nowUTC);
      dt.setUTCDate(dt.getUTCDate() - d);
      const key = new Intl.DateTimeFormat('en-CA', {
        timeZone: safeTz,
        year:     'numeric',
        month:    '2-digit',
        day:      '2-digit',
      }).format(dt);

      filled.push({
        date:         key,
        revenue:      dataMap[key]?.revenue      ?? 0,
        profit:       dataMap[key]?.profit       ?? 0,
        cost:         dataMap[key]?.cost         ?? 0,
        transactions: dataMap[key]?.transactions ?? 0,
        qty_added:    dataMap[key]?.qty_added    ?? 0,
      });
    }
  } else {
    // Weekly — use actual rows
    for (const row of rows) {
      const b   = row.bucket;
      const key = b instanceof Date ? b.toISOString().slice(0, 10) : String(b).slice(0, 10);
      filled.push({
        date:         key,
        revenue:      Math.max(0, parseFloat(row.revenue)    || 0),
        profit:       Math.max(0, parseFloat(row.profit)     || 0),
        cost:         Math.max(0, parseFloat(row.cost)       || 0),
        transactions: Math.max(0, parseInt(row.transactions) || 0),
        qty_added:    Math.max(0, parseInt(row.qty_added)    || 0),
      });
    }
    while (filled.length < 2) {
      filled.push({ date: '', revenue: 0, profit: 0, cost: 0, transactions: 0, qty_added: 0 });
    }
  }

  return filled;
};

// ─────────────────────────────────────────────────────────────────────────────
// getTopItems — JOIN present → alias 't' required
// ─────────────────────────────────────────────────────────────────────────────
const getTopItems = async (userId, period = '1m', limit = 20, tz = 'UTC') => {
  const filter = periodFilter(period, 't', tz);

  const { rows } = await db.query(`
    SELECT
      i.id, i.name, i.sku, i.unit, i.price, i.cost_price,
      SUM(t.quantity)                AS units_sold,
      SUM(t.quantity * t.unit_price) AS revenue,
      SUM(t.quantity * t.cost_price) AS total_cost,
      SUM(CASE WHEN t.unit_price > 0
            THEN t.quantity * (t.unit_price - t.cost_price)
            ELSE 0 END)              AS profit,
      CASE WHEN SUM(t.quantity * t.unit_price) > 0
        THEN ROUND(
          SUM(CASE WHEN t.unit_price > 0
                THEN t.quantity * (t.unit_price - t.cost_price)
                ELSE 0 END)
          / SUM(t.quantity * t.unit_price) * 100, 1)
        ELSE 0
      END                            AS margin_pct
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
const getItemSalesHistory = async (userId, itemId, period = '1m', tz = 'UTC') => {
  const filter = periodFilter(period, 't', tz);

  const { rows } = await db.query(`
    SELECT
      t.id, t.quantity, t.unit_price, t.cost_price,
      (t.quantity * t.unit_price)    AS total,
      CASE WHEN t.unit_price > 0
        THEN t.quantity * (t.unit_price - t.cost_price)
        ELSE 0 END                   AS profit,
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


// ─────────────────────────────────────────────────────────────────────────────
// processRefund — atomic refund with stock restoration
//
// Validates:
//   - originalTxId must exist, belong to userId, be type='sale'
//   - refundQty must be <= original quantity (no over-refund)
//
// Effect:
//   - Inserts a new transaction row: type='refund', same item, negative impact
//   - Restores item stock: quantity += refundQty
//   - All inside BEGIN/COMMIT — rolled back on any failure
// ─────────────────────────────────────────────────────────────────────────────
const processRefund = async (userId, { originalTxId, refundQty, reason }) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch original transaction — must belong to user, must be a sale
    const origRes = await client.query(
      `SELECT t.*, i.name AS item_name, i.unit
       FROM transactions t
       JOIN inventory_items i ON i.id = t.item_id
       WHERE t.id = $1 AND t.user_id = $2 AND t.type = 'sale'`,
      [originalTxId, userId]
    );
    if (!origRes.rows[0]) {
      throw new Error('Original sale transaction not found or already refunded.');
    }
    const orig = origRes.rows[0];

    // 2. Validate refund qty
    const qty = parseInt(refundQty, 10);
    if (!qty || qty <= 0)
      throw new Error('Refund quantity must be at least 1.');
    if (qty > parseInt(orig.quantity))
      throw new Error(`Cannot refund more than original quantity (${orig.quantity} ${orig.unit}).`);

    // 3. Check if already partially/fully refunded for this transaction
    const prevRes = await client.query(
      `SELECT COALESCE(SUM(quantity), 0) AS already_refunded
       FROM transactions
       WHERE user_id = $1
         AND item_id = $2
         AND type = 'refund'
         AND note LIKE $3`,
      [userId, orig.item_id, `%ref:${originalTxId}%`]
    );
    const alreadyRefunded = parseInt(prevRes.rows[0].already_refunded || 0);
    const maxRefundable   = parseInt(orig.quantity) - alreadyRefunded;
    if (qty > maxRefundable) {
      throw new Error(
        `Only ${maxRefundable} ${orig.unit} left to refund (${alreadyRefunded} already refunded).`
      );
    }

    // 4. Insert refund transaction row
    const note = `${reason || 'Customer refund'} | ref:${originalTxId}`;
    const refundRes = await client.query(
      `INSERT INTO transactions
         (user_id, item_id, type, quantity, unit_price, cost_price, note)
       VALUES ($1, $2, 'refund', $3, $4, $5, $6)
       RETURNING *`,
      [userId, orig.item_id, qty, orig.unit_price, orig.cost_price, note]
    );

    // 5. Restore stock
    const itemRes = await client.query(
      `UPDATE inventory_items
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3
       RETURNING id, name, quantity, unit`,
      [qty, orig.item_id, userId]
    );

    await client.query('COMMIT');

    return {
      refund:       refundRes.rows[0],
      item:         itemRes.rows[0],
      originalTx:   orig,
      refundAmount: qty * parseFloat(orig.unit_price),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  create, findAll,
  getSalesSummary, getRevenueTrend,
  getTopItems, getItemSalesHistory,
  processRefund,
};
