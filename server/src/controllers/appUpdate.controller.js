const appUpdateService = require('../services/appUpdate.service');
const { success, created } = require('../utils/response');

const list   = async (req,res,next) => { try { success(res, await appUpdateService.getUpdates(req.query)); } catch(e){next(e);} };
const create = async (req,res,next) => { try { created(res, await appUpdateService.createUpdate(req.user.id, req.body), 'Update posted!'); } catch(e){next(e);} };
const remove = async (req,res,next) => { try { await appUpdateService.deleteUpdate(req.params.id); success(res, null, 'Deleted.'); } catch(e){next(e);} };

module.exports = { list, create, remove };
