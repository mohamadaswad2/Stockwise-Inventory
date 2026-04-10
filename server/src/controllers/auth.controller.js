const authService = require('../services/auth.service');
const AppError    = require('../utils/AppError');
const { success, created } = require('../utils/response');

// ─── Cloudflare Turnstile verification ───────────────────────────────────────
// Skip verification in development or if no secret key configured
const verifyCaptcha = async (token) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || process.env.NODE_ENV !== 'production') return; // skip in dev

  if (!token) throw new AppError('CAPTCHA verification required.', 400);

  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ secret, response: token }),
  });
  const data = await resp.json();
  if (!data.success) throw new AppError('CAPTCHA verification failed. Please try again.', 400);
};

const register = async (req, res, next) => {
  try {
    // Verify CAPTCHA before creating account
    await verifyCaptcha(req.body.captchaToken);
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

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    success(res, null, 'If that email exists, a reset link has been sent.');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;
    await authService.resetPassword(email, token, newPassword);
    success(res, null, 'Password reset successfully. You can now log in.');
  } catch (err) { next(err); }
};

const logout = (_req, res) => success(res, null, 'Logged out.');

module.exports = {
  register, verifyEmail, resendVerification,
  login, changePassword, getProfile,
  forgotPassword, resetPassword, logout,
};
