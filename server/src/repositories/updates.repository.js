const db = require('../config/database');

// ── Public: fetch published updates ──────────────────────────────────────────
const findAll = async ({ limit = 20, offset = 0, type } = {}) => {
  const conds = ['is_published = TRUE'];
  const vals  = [];
  let   i     = 1;

  if (type) { conds.push(`type = $${i++}`); vals.push(type); }

  vals.push(limit, offset);
  const countRes = await db.query(
    `SELECT COUNT(*) FROM app_updates WHERE ${conds.join(' AND ')}`, vals.slice(0, i - 1)
  );

  const rows = await db.query(
    `SELECT id, type, title, content, version, likes, created_at
     FROM app_updates
     WHERE ${conds.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return { updates: rows.rows, total: parseInt(countRes.rows[0].count) };
};

// ── Admin: fetch all (incl. unpublished) ─────────────────────────────────────
const findAllAdmin = async ({ limit = 50, offset = 0 } = {}) => {
  const countRes = await db.query('SELECT COUNT(*) FROM app_updates');
  const rows = await db.query(
    `SELECT * FROM app_updates ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { updates: rows.rows, total: parseInt(countRes.rows[0].count) };
};

// ── Admin: create ─────────────────────────────────────────────────────────────
const create = async ({ type, title, content, version, is_published = true }) => {
  const res = await db.query(
    `INSERT INTO app_updates (type, title, content, version, is_published)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [type, title, content, version || null, is_published]
  );
  return res.rows[0];
};

// ── Admin: update ─────────────────────────────────────────────────────────────
const update = async (id, { type, title, content, version, is_published }) => {
  const res = await db.query(
    `UPDATE app_updates
     SET type=$1, title=$2, content=$3, version=$4, is_published=$5, updated_at=NOW()
     WHERE id=$6
     RETURNING *`,
    [type, title, content, version || null, is_published, id]
  );
  if (!res.rows[0]) throw new Error('Update not found.');
  return res.rows[0];
};

// ── Admin: delete ─────────────────────────────────────────────────────────────
const remove = async (id) => {
  const res = await db.query(
    'DELETE FROM app_updates WHERE id=$1 RETURNING id', [id]
  );
  if (!res.rows[0]) throw new Error('Update not found.');
  return res.rows[0];
};

// ── Public: like (increment) ──────────────────────────────────────────────────
const incrementLikes = async (id) => {
  const res = await db.query(
    'UPDATE app_updates SET likes = likes + 1 WHERE id=$1 AND is_published=TRUE RETURNING id, likes',
    [id]
  );
  if (!res.rows[0]) throw new Error('Update not found.');
  return res.rows[0];
};

module.exports = { findAll, findAllAdmin, create, update, remove, incrementLikes };
