/**
 * User repository — data access layer for the users table.
 * Services call these methods; raw SQL stays here, not in services.
 */
const db = require('../config/database');

const findById = async (id) => {
  const result = await db.query(
    'SELECT id, email, name, role, plan, is_active, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

const findByEmail = async (email) => {
  const result = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  return result.rows[0] || null;
};

const create = async ({ name, email, password }) => {
  const result = await db.query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, plan, is_active, created_at`,
    [name, email.toLowerCase(), password]
  );
  return result.rows[0];
};

const updateById = async (id, fields) => {
  const allowed = ['name', 'plan', 'is_active'];
  const updates = [];
  const values  = [];
  let   idx     = 1;

  for (const [key, val] of Object.entries(fields)) {
    if (allowed.includes(key)) {
      updates.push(`${key} = $${idx++}`);
      values.push(val);
    }
  }

  if (updates.length === 0) return null;

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await db.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, plan`,
    values
  );
  return result.rows[0] || null;
};

module.exports = { findById, findByEmail, create, updateById };
