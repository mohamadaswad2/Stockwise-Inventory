const userRepository = require('../repositories/user.repository');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const getStats = async (req, res, next) => {
  try {
    const [stats, trend] = await Promise.all([
      userRepository.getAdminStats(),
      userRepository.getSignupTrend(30),
    ]);
    success(res, { stats, trend });
  } catch (err) { next(err); }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await userRepository.getAllUsers(req.query);
    success(res, result);
  } catch (err) { next(err); }
};

const toggleLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    const updated = await userRepository.updateById(id, { is_locked: !user.is_locked });
    success(res, { user: updated }, `User ${updated.is_locked ? 'locked' : 'unlocked'}.`);
  } catch (err) { next(err); }
};

module.exports = { getStats, getUsers, toggleLock };
