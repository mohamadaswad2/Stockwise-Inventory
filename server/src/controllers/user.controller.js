/**
 * User controller — profile and account management.
 */
const userRepository = require('../repositories/user.repository');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

const getMe = async (req, res, next) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 404);
    success(res, { user });
  } catch (err) { next(err); }
};

const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await userRepository.updateById(req.user.id, { name });
    success(res, { user }, 'Profile updated.');
  } catch (err) { next(err); }
};

module.exports = { getMe, updateMe };
