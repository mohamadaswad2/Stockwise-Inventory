const txService = require('../services/transaction.service');
const { success, created } = require('../utils/response');

// Validate IANA timezone string — prevent SQL injection
const sanitizeTz = (tz) => {
  if (!tz || typeof tz !== 'string') return 'UTC';
  if (/^[A-Za-z0-9_/+-]{1,50}$/.test(tz)) return tz;
  return 'UTC';
};

const record = async (req, res, next) => {
  try {
    created(res, await txService.recordTransaction(req.user.id, req.body), 'Transaction recorded.');
  } catch (err) { next(err); }
};

const refund = async (req, res, next) => {
  try {
    created(res, await txService.refundTransaction(req.user.id, req.body), 'Refund processed.');
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    success(res, await txService.getTransactions(req.user.id, req.query));
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    const { period = '1m', tz } = req.query;
    const safeTz = sanitizeTz(tz);
    const [sales, topItems, trend] = await Promise.all([
      txService.getSalesSummary(req.user.id, period, safeTz),
      txService.getTopItems(req.user.id, period, safeTz),
      txService.getRevenueTrend(req.user.id, period, safeTz),
    ]);
    success(res, { sales, topItems, trend });
  } catch (err) { next(err); }
};

const analytics = async (req, res, next) => {
  try {
    const { period = '1m', tz } = req.query;
    const safeTz = sanitizeTz(tz);
    success(res, await txService.getAnalytics(req.user.id, req.user.plan, period, safeTz));
  } catch (err) { next(err); }
};

const itemAnalytics = async (req, res, next) => {
  try {
    const { period = '1m', tz } = req.query;
    const safeTz = sanitizeTz(tz);
    success(res, { history: await txService.getItemAnalytics(req.user.id, req.params.itemId, period, safeTz) });
  } catch (err) { next(err); }
};

module.exports = { record, refund, list, summary, analytics, itemAnalytics };
