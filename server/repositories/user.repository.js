/**
 * repositories/user.repository.js — User Data Access Layer
 *
 * All SQL queries for the `users` table live here.
 * Services call this layer; they never write raw SQL themselves.
 */

const { query } = require('../config/database');

const userRepository = {
  /**
   * Find a user by their primary key.
   * Returns user row (without password) or null.
   */
  async findById(id) {
    const { rows } = await query(
      `SELECT id, email, name, role, plan, plan_expires_at, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by email, including the hashed password.
   * Used by the login service to compare credentials.
   */
  async findByEmailWithPassword(email) {
    const { rows } = await query(
      `SELECT id, email, name, role, plan, plan_expires_at, password
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user row.
   * Returns the created user (without password).
   */
  async create({ email, password, name }) {
    const { rows } = await query(
      `INSERT INTO users (email, password, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, role, plan, created_at`,
      [email.toLowerCase(), password, name]
    );
    return rows[0];
  },

  /**
   * Update mutable profile fields for a user.
   */
  async updateProfile(id, { name }) {
    const { rows } = await query(
      `UPDATE users SET name = $1
       WHERE id = $2
       RETURNING id, email, name, role, plan, updated_at`,
      [name, id]
    );
    return rows[0] || null;
  },
};

module.exports = { userRepository };
