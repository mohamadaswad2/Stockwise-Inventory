/**
 * Dashboard controller — aggregated stats view.
 */
const dashboardService = require('../services/dashboard.service');
const { success } = require('../utils/response');

const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.user.id);
    success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { getStats };
