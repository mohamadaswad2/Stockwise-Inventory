const updatesRepo = require('../repositories/updates.repository');
const AppError    = require('../utils/AppError');
const { success, created } = require('../utils/response');

// ── Public ─────────────────────────────────────────────────────────────────────
const list = async (req, res, next) => {
  try {
    const { limit = 20, offset = 0, type } = req.query;
    const result = await updatesRepo.findAll({
      limit: Math.min(parseInt(limit) || 20, 100),
      offset: parseInt(offset) || 0,
      type,
    });
    success(res, result);
  } catch (err) { next(err); }
};

const likeUpdate = async (req, res, next) => {
  try {
    const result = await updatesRepo.incrementLikes(req.params.id);
    success(res, result);
  } catch (err) { next(err); }
};

// ── Admin ──────────────────────────────────────────────────────────────────────
const adminList = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await updatesRepo.findAllAdmin({ limit: parseInt(limit), offset: parseInt(offset) });
    success(res, result);
  } catch (err) { next(err); }
};

const adminCreate = async (req, res, next) => {
  try {
    const { type, title, content, version, is_published } = req.body;
    if (!type || !title || !content) throw new AppError('type, title and content are required.', 400);
    const VALID_TYPES = ['feature','update','fix','announcement'];
    if (!VALID_TYPES.includes(type)) throw new AppError('Invalid type.', 400);
    if (title.length > 200) throw new AppError('Title too long (max 200 chars).', 400);
    const item = await updatesRepo.create({ type, title, content, version, is_published });
    created(res, item, 'Update published.');
  } catch (err) { next(err); }
};

const adminUpdate = async (req, res, next) => {
  try {
    const { type, title, content, version, is_published } = req.body;
    if (!type || !title || !content) throw new AppError('type, title and content are required.', 400);
    const item = await updatesRepo.update(req.params.id, { type, title, content, version, is_published });
    success(res, item, 'Update saved.');
  } catch (err) { next(err); }
};

const adminDelete = async (req, res, next) => {
  try {
    await updatesRepo.remove(req.params.id);
    success(res, null, 'Update deleted.');
  } catch (err) { next(err); }
};

module.exports = { list, likeUpdate, adminList, adminCreate, adminUpdate, adminDelete };
