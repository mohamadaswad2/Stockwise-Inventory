const userRepository = require('../repositories/user.repository');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const getStats = async (req, res, next) => {
  try {
    const [stats, trend] = await Promise.all([userRepository.getAdminStats(), userRepository.getSignupTrend(30)]);
    success(res, { stats, trend });
  } catch(e){next(e);}
};

const getUsers = async (req, res, next) => {
  try { success(res, await userRepository.getAllUsers(req.query)); }
  catch(e){next(e);}
};

// Toggle account lock — also explains what happens
const toggleLock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    if (user.role === 'admin') throw new AppError('Cannot lock admin accounts.', 403);
    const newLocked = !user.is_locked;
    const updated = await userRepository.updateById(id, { is_locked: newLocked });
    success(res, { user: updated },
      newLocked
        ? 'User locked. They cannot login until unlocked. Their data is preserved.'
        : 'User unlocked. They can now login normally.'
    );
  } catch(e){next(e);}
};

// Update user plan — admin only
const updateUserPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'premium', 'deluxe'];
    if (!validPlans.includes(plan)) throw new AppError('Invalid plan.', 400);
    const user = await userRepository.findById(id);
    if (!user) throw new AppError('User not found.', 404);
    if (user.role === 'admin') throw new AppError('Cannot change admin plan.', 403);
    // Unlock if setting paid plan
    const updates = { plan };
    if (plan !== 'free') updates.is_locked = false;
    const updated = await userRepository.updateById(id, updates);
    success(res, { user: updated }, `Plan updated to ${plan}.`);
  } catch(e){next(e);}
};

module.exports = { getStats, getUsers, toggleLock, updateUserPlan };
