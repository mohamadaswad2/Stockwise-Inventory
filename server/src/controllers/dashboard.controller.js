/**
 * Dashboard controller — aggregated stats view.
 */
const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query; // Get period from query params
    const stats = await dashboardService.getStats(req.user.id, period);
    success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { getStats };
