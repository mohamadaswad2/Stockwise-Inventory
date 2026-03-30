/**
 * Alert scheduler — runs periodic low stock checks.
 * Uses setInterval (no external cron dependency needed).
 * Checks every 6 hours for low stock items and sends alerts.
 */
const { query } = require('../config/database');
const { sendLowStockAlert } = require('./email');

// Track which alerts were sent to avoid spam (in-memory, resets on restart)
const sentAlerts = new Set();

const checkLowStock = async () => {
  try {
    console.log('[Alerts] Running low stock check...');

    // Find all users with low stock items who haven't been alerted in this window
    const result = await query(`
      SELECT
        u.id AS user_id, u.email, u.name,
        json_agg(json_build_object(
          'name', i.name,
          'sku', i.sku,
          'quantity', i.quantity,
          'unit', i.unit,
          'threshold', i.low_stock_threshold
        ) ORDER BY i.quantity ASC) AS items
      FROM inventory_items i
      JOIN users u ON u.id = i.user_id
      WHERE i.is_active = TRUE
        AND i.quantity <= i.low_stock_threshold
        AND u.is_active = TRUE
        AND u.is_email_verified = TRUE
        AND u.plan != 'free'
      GROUP BY u.id, u.email, u.name
      HAVING COUNT(*) > 0
    `);

    for (const row of result.rows) {
      const key = `${row.user_id}-${new Date().toDateString()}`;
      if (sentAlerts.has(key)) continue; // Already alerted today

      try {
        await sendLowStockAlert(row.email, row.name, row.items);
        sentAlerts.add(key);
        console.log(`[Alerts] Low stock alert sent to: ${row.email} (${row.items.length} items)`);
      } catch (err) {
        console.error(`[Alerts] Failed to send to ${row.email}:`, err.message);
      }
    }

    console.log(`[Alerts] Check complete. Notified ${result.rows.length} users.`);
  } catch (err) {
    console.error('[Alerts] Check failed:', err.message);
  }
};

const startScheduler = () => {
  if (!process.env.BREVO_API_KEY) {
    console.warn('[Alerts] BREVO_API_KEY not set — email alerts disabled.');
    return;
  }

  // Run once 2 minutes after startup
  setTimeout(checkLowStock, 2 * 60 * 1000);

  // Then every 6 hours
  setInterval(checkLowStock, 6 * 60 * 60 * 1000);

  console.log('[Alerts] Low stock scheduler started (runs every 6 hours).');
};

module.exports = { startScheduler, checkLowStock };
