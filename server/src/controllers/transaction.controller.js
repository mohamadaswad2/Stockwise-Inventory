const txService = require('../services/transaction.service');
const { success, created } = require('../utils/response');

const record = async (req, res, next) => {
  try {
    created(res, await txService.recordTransaction(req.user.id, req.body), 'Transaction recorded.');
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    success(res, await txService.getTransactions(req.user.id, req.query));
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    const { period = '1m' } = req.query;
    const [sales, topItems, trend] = await Promise.all([
      txService.getSalesSummary(req.user.id, period),
      txService.getTopItems(req.user.id, period),
      txService.getRevenueTrend(req.user.id, period),
    ]);
    success(res, { sales, topItems, trend });
  } catch (err) { next(err); }
};

const analytics = async (req, res, next) => {
  try {
    const { period = '1m' } = req.query;
    // Pass req.user.plan for plan gating
    success(res, await txService.getAnalytics(req.user.id, req.user.plan, period));
  } catch (err) { next(err); }
};

const itemAnalytics = async (req, res, next) => {
  try {
    const { period = '1m' } = req.query;
    success(res, { history: await txService.getItemAnalytics(req.user.id, req.params.itemId, period) });
  } catch (err) { next(err); }
};

module.exports = { record, list, summary, analytics, itemAnalytics };
