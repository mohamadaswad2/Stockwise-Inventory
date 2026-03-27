/**
 * Auth controller — thin layer between routes and auth service.
 * No business logic here: delegate to service, format response.
 */
const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { user, token } = await authService.register(req.body);
    created(res, { user, token }, 'Account created successfully.');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { user, token } = await authService.login(req.body);
    success(res, { user, token }, 'Login successful.');
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    success(res, { user });
  } catch (err) { next(err); }
};

// Logout is handled client-side (drop the token)
const logout = (_req, res) => {
  success(res, null, 'Logged out successfully.');
};

module.exports = { register, login, getProfile, logout };
