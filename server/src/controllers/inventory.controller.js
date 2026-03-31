const inventoryService = require('../services/inventory.service');
const { success, created } = require('../utils/response');

const getItems    = async (req, res, next) => { try { success(res, await inventoryService.getItems(req.user.id, req.query)); } catch(e){next(e);} };
const getItem     = async (req, res, next) => { try { success(res, { item: await inventoryService.getItem(req.params.id, req.user.id) }); } catch(e){next(e);} };
const createItem  = async (req, res, next) => { try { created(res, { item: await inventoryService.createItem(req.user.id, req.body) }, 'Item created.'); } catch(e){next(e);} };
const updateItem  = async (req, res, next) => { try { success(res, { item: await inventoryService.updateItem(req.params.id, req.user.id, req.body) }, 'Item updated.'); } catch(e){next(e);} };
const deleteItem  = async (req, res, next) => { try { await inventoryService.deleteItem(req.params.id, req.user.id); success(res, null, 'Item deleted.'); } catch(e){next(e);} };
const quickSell   = async (req, res, next) => { try { success(res, await inventoryService.quickSell(req.user.id, req.params.id, Number(req.body.quantity)), 'Sale recorded.'); } catch(e){next(e);} };

const exportCSV = async (req, res, next) => {
  try {
    const csv = await inventoryService.exportCSV(req.user.id, req.user.plan);
    const filename = `stockwise-${new Date().toISOString().slice(0,10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  } catch(e){next(e);}
};

const getExportQuota = async (req, res, next) => {
  try { success(res, await inventoryService.getExportQuota(req.user.id, req.user.plan)); }
  catch(e){next(e);}
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, quickSell, exportCSV, getExportQuota };
