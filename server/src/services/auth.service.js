const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const userRepository = require('../repositories/user.repository');
const { sendVerificationEmail } = require('../utils/email');
const AppError = require('../utils/AppError');

const SALT_ROUNDS  = 12;
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';
const TRIAL_DAYS   = 30;

const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: TOKEN_EXPIRY }
);

/** Generate 6-digit numeric OTP */
const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

const register = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new AppError('An account with that email already exists.', 409);

  const hashed  = await bcrypt.hash(password, SALT_ROUNDS);
  const otp     = generateOTP();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const user = await userRepository.create({
    name, email, password: hashed,
    emailVerifyToken:   otp,
    emailVerifyExpires: expires,
    trialEndsAt:        trialEnd,
    plan:               'deluxe', // Start on Deluxe trial
  });

  // Send OTP email (non-blocking — don't fail registration if email fails)
  sendVerificationEmail(email, name, otp).catch(err =>
    console.error('[Email] Failed to send verification:', err.message)
  );

  return { user, requiresVerification: true };
};

const verifyEmail = async (email, otp) => {
  const user = await userRepository.findByEmail(email);
  if (!user) throw new AppError('User not found.', 404);
  if (user.is_email_verified) throw new AppError('Email already verified.', 400);
  if (!user.email_verify_token) throw new AppError('No verification pending.', 400);
  if (new Date() > new Date(user.email_verify_expires))
    throw new AppError('Verification code has expired. Please request a new one.', 410);
  if (user.email_verify_token !== otp)
    throw new AppError('Invalid verification code.', 401);

  await userRepository.updateById(user.id, {
    is_email_verified:   true,
    email_verify_token:  null,
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

  // Admin bypass — skip email verification check
  if (user.role !== 'admin' && !user.is_email_verified)
    throw new AppError('Please verify your email before logging in.', 403);

  const { password: _, ...safeUser } = user;

  // Check if trial has expired → lock account
  if (safeUser.trial_ends_at && new Date() > new Date(safeUser.trial_ends_at)
      && safeUser.plan === 'deluxe' && !safeUser.stripe_subscription_id) {
    await userRepository.updateById(user.id, { is_locked: true, plan: 'free' });
    safeUser.is_locked = true;
    safeUser.plan = 'free';
  }

  const token = signToken(safeUser);
  return { user: safeUser, token };
};

const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await userRepository.findByEmail(
    (await userRepository.findById(userId)).email
  );
  const valid = await bcrypt.compare(currentPassword, user.password);
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

module.exports = { register, verifyEmail, resendVerification, login, changePassword, getProfile };
