/**
 * Auth service — business logic for register/login.
 * Controllers stay thin; this is where decisions are made.
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

const SALT_ROUNDS  = 12;
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for the given user payload.
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Register a new user (tenant).
 */
const register = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new AppError('An account with that email already exists.', 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user   = await userRepository.create({ name, email, password: hashed });
  const token  = signToken(user);

  return { user, token };
};

/**
 * Login with email + password.
 */
const login = async ({ email, password }) => {
  // Fetch with password (findByEmail returns full row)
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }
  if (!user.is_active) {
    throw new AppError('Your account has been deactivated.', 403);
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Strip password before returning
  const { password: _pwd, ...safeUser } = user;
  const token = signToken(safeUser);

  return { user: safeUser, token };
};

/**
 * Return the authenticated user profile (no password).
 */
const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

module.exports = { register, login, getProfile };
