const txService = require('../services/transaction.service');
const { success, created } = require('../utils/response');

const record = async (req, res, next) => {
  try {
    const result = await txService.recordTransaction(req.user.id, req.body);
    created(res, result, 'Transaction recorded.');
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const result = await txService.getTransactions(req.user.id, req.query);
    success(res, result);
  } catch (err) { next(err); }
};

const summary = async (req, res, next) => {
  try {
    const [sales, topItems, trend] = await Promise.all([
      txService.getSalesSummary(req.user.id),
      txService.getTopItems(req.user.id),
      txService.getRevenueTrend(req.user.id, 30),
    ]);
    success(res, { sales, topItems, trend });
  } catch (err) { next(err); }
};

module.exports = { record, list, summary };