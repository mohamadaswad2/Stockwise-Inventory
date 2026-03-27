const authService = require('../services/auth.service');
const { success, created, error } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Account created. Please check your email for verification code.');
  } catch (err) { next(err); }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail(email, code);
    success(res, result, 'Email verified successfully!');
  } catch (err) { next(err); }
};

const resendVerification = async (req, res, next) => {
  try {
    await authService.resendVerification(req.body.email);
    success(res, null, 'Verification code resent. Check your email.');
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful.');
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    success(res, null, 'Password changed successfully.');
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    success(res, { user });
  } catch (err) { next(err); }
};

const logout = (_req, res) => success(res, null, 'Logged out.');

module.exports = { register, verifyEmail, resendVerification, login, changePassword, getProfile, logout };
