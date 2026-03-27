/**
 * Category repository.
 *
 * PERUBAHAN: Categories sekarang adalah GLOBAL (user_id IS NULL).
 * Semua user nampak categories yang sama — hanya admin boleh edit melalui seed.js.
 * User tidak boleh create atau delete categories sendiri.
 */
const db = require('../config/database');

/**
 * Ambil semua global preset categories (user_id IS NULL).
 * Disusun mengikut nama A-Z.
 */
const findAllGlobal = async () => {
  const result = await db.query(
    `SELECT c.id, c.name, c.description,
            COUNT(i.id) AS item_count
     FROM categories c
     LEFT JOIN inventory_items i ON i.category_id = c.id AND i.is_active = TRUE
     WHERE c.user_id IS NULL
     GROUP BY c.id
     ORDER BY c.name ASC`
  );
  return result.rows;
};

/**
 * Semak sama ada category id tu wujud sebagai global category.
 * Digunakan oleh inventory service untuk validate category_id.
 */
const findGlobalById = async (id) => {
  const result = await db.query(
    `SELECT id, name FROM categories WHERE id = $1 AND user_id IS NULL`,
    [id]
  );
  return result.rows[0] || null;
};

module.exports = { findAllGlobal, findGlobalById };
