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

// ── Disposable / temp email domains to block ──────────────────────────────
const BLOCKED_EMAIL_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','10minutemail.com','temp-mail.org',
  'throwaway.email','yopmail.com','trashmail.com','fakeinbox.com',
  'sharklasers.com','guerrillamailblock.com','grr.la','guerrillamail.info',
  'guerrillamail.biz','guerrillamail.de','guerrillamail.net','guerrillamail.org',
  'spam4.me','trashmail.at','trashmail.io','trashmail.me','trashmail.net',
  'dispostable.com','mailnull.com','spamgourmet.com','spamgourmet.net',
  'tempmail.com','tempail.com','tempr.email','discard.email',
  'getairmail.com','filzmail.com','throwam.com','owlpic.com',
  'maildrop.cc','spamfree24.org','trashmail.xyz','mailtemp.info',
  'anonymbox.com','mailnesia.com','receivemail.com','mailseal.de',
  'wegwerfmail.de','wegwerfmail.net','wegwerfmail.org','mailboxy.fun',
  'moakt.ws','moakt.com','tempinbox.com','tempinbox.co.uk',
  'spambox.us','inboxbear.com','spamdecoy.net','mt2015.com',
]);

const isDisposableEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return BLOCKED_EMAIL_DOMAINS.has(domain);
};

// ── Server-side password strength check ───────────────────────────────────
const isStrongPassword = (pw) => {
  return (
    pw.length >= 8 &&
    /[A-Z]/.test(pw) &&
    /[a-z]/.test(pw) &&
    /[0-9]/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
};

const register = async ({ name, email, password }) => {
  // Validate password strength server-side (defense against API bypass)
  if (!isStrongPassword(password)) {
    throw new AppError('Password must be at least 8 characters with uppercase, lowercase, number and special character.', 400);
  }

  // Block disposable / temp email providers
  if (isDisposableEmail(email)) {
    throw new AppError('Please use a real email address. Temporary email services are not allowed.', 400);
  }

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

  // Send OTP — await so we can catch and report error properly
  try {
    await sendVerificationEmail(email, name, otp);
    console.log('[Auth] OTP sent to:', email);
  } catch (err) {
    console.error('[Auth] Email send failed:', err.message);
    // Don't fail registration if email fails — user can resend
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
    throw new AppError('Invalid verification code.', 422);

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
  console.log('[Auth] OTP resent to:', email);
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

  // Auto-lock expired trials
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

const forgotPassword = async (email) => {
  const user = await userRepository.findByEmail(email);
  // Security: don't reveal whether email exists or not
  if (!user) {
    console.log('[Auth] Forgot password — email not found (silent):', email);
    return true;
  }

  const resetToken   = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await userRepository.updateById(user.id, {
    reset_password_token:   resetToken,
    reset_password_expires: resetExpires,
  });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

  try {
    await sendPasswordResetEmail(email, user.name, resetUrl);
    console.log('[Auth] Reset email sent to:', email);
  } catch (err) {
    console.error('[Auth] Reset email failed:', err.message);
    // Don't fail — user can retry
  }

  return true;
};

const resetPassword = async (email, token, newPassword) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !user.reset_password_token)
    throw new AppError('Invalid or expired reset link.', 400);
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

  console.log('[Auth] Password reset for:', email);
  return true;
};

module.exports = { register, verifyEmail, resendVerification, login, forgotPassword, resetPassword, changePassword, getProfile };
