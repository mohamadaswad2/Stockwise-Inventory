const { query } = require('../config/database');
const AppError  = require('../utils/AppError');

const getUpdates = async ({ page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const [countRes, rows] = await Promise.all([
    query(`SELECT COUNT(*) FROM app_updates`),
    query(
      `SELECT u.id, u.title, u.content, u.version, u.type, u.created_at,
              a.name AS author_name
       FROM app_updates u
       LEFT JOIN users a ON a.id = u.author_id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
  ]);
  return {
    updates: rows.rows,
    total:   parseInt(countRes.rows[0].count),
    page, limit,
  };
};

const createUpdate = async (authorId, { title, content, version, type }) => {
  if (!title?.trim())   throw new AppError('Title is required.', 400);
  if (!content?.trim()) throw new AppError('Content is required.', 400);

  const validTypes = ['update','feature','fix','announcement'];
  const safeType   = validTypes.includes(type) ? type : 'update';

  const result = await query(
    `INSERT INTO app_updates (title, content, version, type, author_id)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [title.trim(), content.trim(), version?.trim() || null, safeType, authorId]
  );
  return result.rows[0];
};

const deleteUpdate = async (id) => {
  const result = await query(
    `DELETE FROM app_updates WHERE id=$1 RETURNING id`, [id]
  );
  if (!result.rows[0]) throw new AppError('Update not found.', 404);
  return result.rows[0];
};

module.exports = { getUpdates, createUpdate, deleteUpdate };
