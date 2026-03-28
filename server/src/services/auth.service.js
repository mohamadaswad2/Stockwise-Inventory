const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const userRepository = require('../repositories/user.repository');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');
const AppError = require('../utils/AppError');

const SALT_ROUNDS  = 12;
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
const TRIAL_DAYS   = 30;

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: TOKEN_EXPIRY }
);

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const register = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new AppError('An account with that email already exists.', 409);

  const hashed   = await bcrypt.hash(password, SALT_ROUNDS);
  const otp      = generateOTP();
  const expires  = new Date(Date.now() + 15 * 60 * 1000);
  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const user = await userRepository.create({
    name, email, password: hashed,
    emailVerifyToken:   otp,
    emailVerifyExpires: expires,
    trialEndsAt:        trialEnd,
    plan:               'deluxe',
  });

  try {
    await sendVerificationEmail(email, name, otp);
    console.log('[Auth] OTP sent to:', email);
  } catch (err) {
    console.error('[Auth] Email send failed:', err.message);
  }

  return { user, requiresVerification: true };
};

const verifyEmail = async (email, otp) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);
  if (user.is_email_verified) throw new AppError('Email already verified.', 400);
  if (!user.email_verify_token) throw new AppError('No verification pending.', 400);
  if (new Date() > new Date(user.email_verify_expires))
    throw new AppError('Verification code has expired. Request a new one.', 410);
  if (user.email_verify_token !== String(otp))
    throw new AppError('Invalid verification code.', 401);

  await userRepository.updateById(user.id, {
    is_email_verified:    true,
    email_verify_token:   null,
    email_verify_expires: null,
  });

  const { password: _, ...safeUser } = { ...user, is_email_verified: true };
  const token = signToken(safeUser);
  return { user: safeUser, token };
};

const resendVerification = async (email) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);
  if (user.is_email_verified) throw new AppError('Email already verified.', 400);

  const otp     = generateOTP();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await userRepository.updateById(user.id, {
    email_verify_token:   otp,
    email_verify_expires: expires,
  });

  await sendVerificationEmail(email, user.name, otp);
  return true;
};

const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid email or password.', 401);
  if (!user.is_active) throw new AppError('Your account has been deactivated.', 403);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new AppError('Invalid email or password.', 401);

  if (user.role !== 'admin' && !user.is_email_verified)
    throw new AppError('Please verify your email before logging in.', 403);

  const { password: _, ...safeUser } = user;

  if (safeUser.trial_ends_at && new Date() > new Date(safeUser.trial_ends_at)
      && safeUser.plan === 'deluxe' && !safeUser.stripe_subscription_id) {
    await userRepository.updateById(user.id, { is_locked: true, plan: 'free' });
    safeUser.is_locked = true;
    safeUser.plan = 'free';
  }

  const token = signToken(safeUser);
  return { user: safeUser, token };
};

// ── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  // Always return success to prevent email enumeration
  if (!user) return true;

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepository.updateById(user.id, {
    reset_password_token:   resetToken,
    reset_password_expires: resetExpires,
  });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendPasswordResetEmail(email, user.name, resetUrl);
    console.log('[Auth] Password reset email sent to:', email);
  } catch (err) {
    console.error('[Auth] Reset email failed:', err.message);
  }

  return true;
};

const resetPassword = async (email, token, newPassword) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('Invalid or expired reset link.', 400);
  if (!user.reset_password_token) throw new AppError('No password reset requested.', 400);
  if (new Date() > new Date(user.reset_password_expires))
    throw new AppError('Reset link has expired. Please request a new one.', 410);
  if (user.reset_password_token !== token)
    throw new AppError('Invalid reset link.', 400);

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.updateById(user.id, {
    password:               hashed,
    reset_password_token:   null,
    reset_password_expires: null,
  });

  return true;
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const fullUser = await userRepository.findByEmail(
    (await userRepository.findById(userId)).email
  );
  const valid = await bcrypt.compare(currentPassword, fullUser.password);
  if (!valid) throw new AppError('Current password is incorrect.', 401);
  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await userRepository.updateById(userId, { password: hashed });
  return true;
};

const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

module.exports = {
  register, verifyEmail, resendVerification,
  login, forgotPassword, resetPassword, changePassword, getProfile,
};
