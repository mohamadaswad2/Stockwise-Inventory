/**
 * Monitoring API Routes
 * Provides endpoints for anomaly detection and alerts
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const monitoringService = require('../services/monitoring.service');

/**
 * GET /api/monitoring/checks
 * Run all monitoring checks for current user
 */
router.get('/checks', authenticate, async (req, res) => {
  try {
    const results = await monitoringService.runMonitoringChecks(req.user.id);
    res.json(results);
  } catch (err) {
    console.error('Monitoring checks error:', err);
    res.status(500).json({ message: 'Failed to run monitoring checks' });
  }
});

/**
 * GET /api/monitoring/anomalies
 * Get recent anomalies for current user
 */
router.get('/anomalies', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const anomalies = await monitoringService.getRecentAnomalies(req.user.id, limit);
    res.json({ anomalies, count: anomalies.length });
  } catch (err) {
    console.error('Get anomalies error:', err);
    res.status(500).json({ message: 'Failed to fetch anomalies' });
  }
});

/**
 * POST /api/monitoring/anomalies/:id/acknowledge
 * Acknowledge an anomaly (mark as reviewed)
 */
router.post('/anomalies/:id/acknowledge', authenticate, async (req, res) => {
  try {
    const success = await monitoringService.acknowledgeAnomaly(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Anomaly not found' });
    }
    res.json({ message: 'Anomaly acknowledged' });
  } catch (err) {
    console.error('Acknowledge anomaly error:', err);
    res.status(500).json({ message: 'Failed to acknowledge anomaly' });
  }
});

/**
 * GET /api/monitoring/negative-revenue
 * Check for negative revenue (refunds > sales)
 */
router.get('/negative-revenue', authenticate, async (req, res) => {
  try {
    const period = req.query.period || '7d';
    const result = await monitoringService.checkNegativeRevenue(req.user.id, period);
    res.json(result);
  } catch (err) {
    console.error('Negative revenue check error:', err);
    res.status(500).json({ message: 'Failed to check negative revenue' });
  }
});

/**
 * GET /api/monitoring/revenue-drop
 * Check for significant revenue drops
 */
router.get('/revenue-drop', authenticate, async (req, res) => {
  try {
    const result = await monitoringService.checkRevenueDrop(req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Revenue drop check error:', err);
    res.status(500).json({ message: 'Failed to check revenue drop' });
  }
});

module.exports = router;
