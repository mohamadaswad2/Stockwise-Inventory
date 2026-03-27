const db = require('../config/database');

const findById = async (id) => {
  const result = await db.query(
    `SELECT id, email, name, role, plan, is_active, is_locked,
            is_email_verified, trial_ends_at, stripe_customer_id,
            stripe_subscription_id, created_at
     FROM users WHERE id = $1`, [id]
  );
  return result.rows[0] || null;
};

const findByEmail = async (email) => {
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0] || null;
};

const create = async ({ name, email, password, emailVerifyToken, emailVerifyExpires, trialEndsAt, plan }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password, email_verify_token, email_verify_expires, trial_ends_at, plan)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, email, name, role, plan, is_active, is_locked, is_email_verified, trial_ends_at, created_at`,
    [name, email.toLowerCase(), password, emailVerifyToken, emailVerifyExpires, trialEndsAt, plan || 'deluxe']
  );
  return result.rows[0];
};

const updateById = async (id, fields) => {
  const allowed = [
    'name', 'plan', 'is_active', 'is_locked', 'is_email_verified',
    'email_verify_token', 'email_verify_expires', 'trial_ends_at',
    'stripe_customer_id', 'stripe_subscription_id', 'password',
  ];
  const updates = [];
  const values  = [];
  let   idx     = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }
  if (!updates.length) return null;
  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}
     RETURNING id, email, name, role, plan, is_active, is_locked, is_email_verified, trial_ends_at`,
    values
  );
  return result.rows[0] || null;
};

// Admin queries
const getAllUsers = async ({ page = 1, limit = 20, search = '', plan, verified }) => {
  const offset = (page - 1) * limit;
  const conditions = ['1=1'];
  const values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(email ILIKE $${idx} OR name ILIKE $${idx})`);
    values.push(`%${search}%`); idx++;
  }
  if (plan) { conditions.push(`plan = $${idx++}`); values.push(plan); }
  if (verified !== undefined) { conditions.push(`is_email_verified = $${idx++}`); values.push(verified); }

  const where = conditions.join(' AND ');
  const countRes = await db.query(`SELECT COUNT(*) FROM users WHERE ${where} AND role != 'admin'`, values);
  const total = parseInt(countRes.rows[0].count);

  const rows = await db.query(
    `SELECT id, email, name, role, plan, is_active, is_locked, is_email_verified, trial_ends_at, created_at
     FROM users WHERE ${where} AND role != 'admin'
     ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
    [...values, limit, offset]
  );
  return { users: rows.rows, total, page, limit };
};

const getAdminStats = async () => {
  const result = await db.query(`
    SELECT
      COUNT(*)                                          AS total_users,
      COUNT(*) FILTER (WHERE plan = 'deluxe')           AS deluxe_users,
      COUNT(*) FILTER (WHERE plan = 'premium')          AS premium_users,
      COUNT(*) FILTER (WHERE plan = 'starter')          AS starter_users,
      COUNT(*) FILTER (WHERE plan = 'free')             AS free_users,
      COUNT(*) FILTER (WHERE is_email_verified = TRUE)  AS verified_users,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') AS new_this_month,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')  AS new_this_week
    FROM users WHERE role != 'admin'
  `);
  return result.rows[0];
};

const getSignupTrend = async (days = 30) => {
  const result = await db.query(`
    SELECT DATE(created_at) AS date, COUNT(*) AS count
    FROM users
    WHERE created_at > NOW() - INTERVAL '${days} days' AND role != 'admin'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  return result.rows;
};

module.exports = { findById, findByEmail, create, updateById, getAllUsers, getAdminStats, getSignupTrend };
