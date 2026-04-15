/**
 * Production Monitoring Service
 * Detects revenue anomalies, negative values, and unusual transaction patterns
 */

const db = require('../config/database');

// Anomaly detection thresholds
const THRESHOLDS = {
  // Revenue drop more than 50% day-over-day
  REVENUE_DROP_PERCENT: 50,
  
  // Refund rate exceeds 30% of sales
  REFUND_RATE_PERCENT: 30,
  
  // Negative net revenue (refunds > sales)
  NEGATIVE_REVENUE: 0,
  
  // Unusual single transaction value (> 10x average)
  TRANSACTION_OUTLIER_MULTIPLIER: 10,
  
  // Zero transactions for active user (inactivity alert)
  INACTIVITY_DAYS: 7,
};

/**
 * Log anomaly to database for audit trail
 */
const logAnomaly = async (userId, type, severity, message, data) => {
  try {
    await db.query(
      `INSERT INTO anomaly_logs (user_id, type, severity, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId, type, severity, message, JSON.stringify(data)]
    );
    
    // Also log to console for immediate visibility
    console.warn(`[ANOMALY-${severity}] User ${userId}: ${type} - ${message}`, data);
    
    return true;
  } catch (err) {
    console.error('Failed to log anomaly:', err);
    return false;
  }
};

/**
 * Check for negative revenue (refunds exceed sales)
 */
const checkNegativeRevenue = async (userId, period = '7d') => {
  const { rows } = await db.query(`
    SELECT 
      COALESCE(SUM(
        CASE 
          WHEN type = 'sale' AND status = 'completed' THEN quantity * unit_price
          WHEN type = 'refund' AND status = 'completed' THEN -(quantity * unit_price)
          ELSE 0
        END
      ), 0) as net_revenue,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type = 'sale' AND status = 'completed'), 0) as gross_revenue,
      COALESCE(SUM(quantity * unit_price) FILTER (WHERE type = 'refund' AND status = 'completed'), 0) as total_refunds
    FROM transactions
    WHERE user_id = $1
      AND status = 'completed'
      AND created_at > NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
  `, [userId]);
  
  const { net_revenue, gross_revenue, total_refunds } = rows[0];
  
  // Detect negative revenue
  if (parseFloat(net_revenue) < 0) {
    await logAnomaly(userId, 'NEGATIVE_REVENUE', 'HIGH', 
      `Net revenue is negative: RM${net_revenue} (Refunds: RM${total_refunds} > Sales: RM${gross_revenue})`,
      { net_revenue, gross_revenue, total_refunds, period }
    );
    return { anomaly: true, type: 'NEGATIVE_REVENUE', data: rows[0] };
  }
  
  // Detect high refund rate
  if (parseFloat(gross_revenue) > 0) {
    const refundRate = (parseFloat(total_refunds) / parseFloat(gross_revenue)) * 100;
    if (refundRate > THRESHOLDS.REFUND_RATE_PERCENT) {
      await logAnomaly(userId, 'HIGH_REFUND_RATE', 'MEDIUM',
        `Refund rate is ${refundRate.toFixed(1)}% (threshold: ${THRESHOLDS.REFUND_RATE_PERCENT}%)`,
        { refundRate, gross_revenue, total_refunds, period }
      );
      return { anomaly: true, type: 'HIGH_REFUND_RATE', refundRate, data: rows[0] };
    }
  }
  
  return { anomaly: false, data: rows[0] };
};

/**
 * Check for day-over-day revenue drops
 */
const checkRevenueDrop = async (userId) => {
  const { rows } = await db.query(`
    WITH daily_revenue AS (
      SELECT 
        DATE_TRUNC('day', created_at) as day,
        COALESCE(SUM(
          CASE 
            WHEN type = 'sale' AND status = 'completed' THEN quantity * unit_price
            WHEN type = 'refund' AND status = 'completed' THEN -(quantity * unit_price)
            ELSE 0
          END
        ), 0) as net_revenue
      FROM transactions
      WHERE user_id = $1
        AND status = 'completed'
        AND created_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY day DESC
      LIMIT 2
    )
    SELECT 
      day,
      net_revenue,
      LAG(net_revenue) OVER (ORDER BY day) as prev_revenue
    FROM daily_revenue
    ORDER BY day DESC
    LIMIT 1
  `, [userId]);
  
  if (rows.length === 0) return { anomaly: false };
  
  const { net_revenue, prev_revenue } = rows[0];
  
  if (prev_revenue && parseFloat(prev_revenue) > 0) {
    const dropPercent = ((parseFloat(prev_revenue) - parseFloat(net_revenue)) / parseFloat(prev_revenue)) * 100;
    
    if (dropPercent > THRESHOLDS.REVENUE_DROP_PERCENT) {
      await logAnomaly(userId, 'REVENUE_DROP', 'MEDIUM',
        `Revenue dropped ${dropPercent.toFixed(1)}% from previous day`,
        { current: net_revenue, previous: prev_revenue, dropPercent }
      );
      return { anomaly: true, type: 'REVENUE_DROP', dropPercent, data: rows[0] };
    }
  }
  
  return { anomaly: false, data: rows[0] };
};

/**
 * Check for outlier transactions
 */
const checkOutlierTransactions = async (userId) => {
  const { rows } = await db.query(`
    WITH stats AS (
      SELECT 
        AVG(quantity * unit_price) as avg_amount,
        STDDEV(quantity * unit_price) as stddev_amount
      FROM transactions
      WHERE user_id = $1
        AND type = 'sale'
        AND status = 'completed'
        AND created_at > NOW() - INTERVAL '30 days'
    )
    SELECT 
      t.id,
      t.quantity * t.unit_price as amount,
      s.avg_amount,
      CASE WHEN s.avg_amount > 0 
        THEN (t.quantity * t.unit_price) / s.avg_amount 
        ELSE 0 
      END as multiplier
    FROM transactions t
    CROSS JOIN stats s
    WHERE t.user_id = $1
      AND t.type = 'sale'
      AND t.status = 'completed'
      AND t.created_at > NOW() - INTERVAL '7 days'
      AND s.avg_amount > 0
      AND (t.quantity * t.unit_price) > (s.avg_amount * $2)
    LIMIT 5
  `, [userId, THRESHOLDS.TRANSACTION_OUTLIER_MULTIPLIER]);
  
  if (rows.length > 0) {
    await logAnomaly(userId, 'OUTLIER_TRANSACTIONS', 'LOW',
      `Found ${rows.length} transactions > ${THRESHOLDS.TRANSACTION_OUTLIER_MULTIPLIER}x average`,
      { outliers: rows }
    );
    return { anomaly: true, type: 'OUTLIER_TRANSACTIONS', data: rows };
  }
  
  return { anomaly: false };
};

/**
 * Run all monitoring checks for a user
 */
const runMonitoringChecks = async (userId) => {
  const results = {
    timestamp: new Date().toISOString(),
    userId,
    checks: {}
  };
  
  results.checks.negativeRevenue = await checkNegativeRevenue(userId);
  results.checks.revenueDrop = await checkRevenueDrop(userId);
  results.checks.outlierTransactions = await checkOutlierTransactions(userId);
  
  // Additional checks for today
  results.checks.todayNegative = await checkNegativeRevenue(userId, 'today');
  
  const hasAnomalies = Object.values(results.checks).some(c => c.anomaly);
  
  return {
    ...results,
    hasAnomalies,
    summary: hasAnomalies ? 'Anomalies detected - review required' : 'All checks passed'
  };
};

/**
 * Get recent anomalies for a user
 */
const getRecentAnomalies = async (userId, limit = 10) => {
  const { rows } = await db.query(`
    SELECT 
      id,
      type,
      severity,
      message,
      data,
      created_at,
      acknowledged
    FROM anomaly_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit]);
  
  return rows.map(row => ({
    ...row,
    data: JSON.parse(row.data || '{}')
  }));
};

/**
 * Acknowledge an anomaly (mark as reviewed)
 */
const acknowledgeAnomaly = async (userId, anomalyId) => {
  const { rowCount } = await db.query(`
    UPDATE anomaly_logs
    SET acknowledged = TRUE, acknowledged_at = NOW()
    WHERE id = $1 AND user_id = $2
  `, [anomalyId, userId]);
  
  return rowCount > 0;
};

module.exports = {
  runMonitoringChecks,
  checkNegativeRevenue,
  checkRevenueDrop,
  checkOutlierTransactions,
  getRecentAnomalies,
  acknowledgeAnomaly,
  THRESHOLDS
};
