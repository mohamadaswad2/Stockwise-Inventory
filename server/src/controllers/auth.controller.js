const authService = require('../services/auth.service');
const { success, created } = require('../utils/response');

const register        = async (req, res, next) => { try { const r = await authService.register(req.body); created(res, r, 'Account created. Check email for code.'); } catch(e){next(e);} };
const verifyEmail     = async (req, res, next) => { try { const r = await authService.verifyEmail(req.body.email, req.body.code); success(res, r, 'Email verified!'); } catch(e){next(e);} };
const resendVerify    = async (req, res, next) => { try { await authService.resendVerification(req.body.email); success(res, null, 'Code resent.'); } catch(e){next(e);} };
const login           = async (req, res, next) => { try { const r = await authService.login(req.body); success(res, r, 'Login successful.'); } catch(e){next(e);} };
const forgotPassword  = async (req, res, next) => { try { await authService.forgotPassword(req.body.email); success(res, null, 'If that email exists, a reset link has been sent.'); } catch(e){next(e);} };
const resetPassword   = async (req, res, next) => { try { await authService.resetPassword(req.body.email, req.body.token, req.body.password); success(res, null, 'Password reset successfully.'); } catch(e){next(e);} };
const changePassword  = async (req, res, next) => { try { await authService.changePassword(req.user.id, req.body); success(res, null, 'Password changed.'); } catch(e){next(e);} };
const getProfile      = async (req, res, next) => { try { const u = await authService.getProfile(req.user.id); success(res, {user:u}); } catch(e){next(e);} };
const logout          = (_req, res) => success(res, null, 'Logged out.');

module.exports = { register, verifyEmail, resendVerify, login, forgotPassword, resetPassword, changePassword, getProfile, logout };
