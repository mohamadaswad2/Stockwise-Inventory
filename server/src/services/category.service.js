/**
 * Category service — hanya expose global categories untuk user baca.
 * User tidak boleh create atau delete categories.
 */
const categoryRepository = require('../repositories/category.repository');

/**
 * Ambil semua preset global categories.
 * Ini yang akan populate dropdown dalam frontend.
 */
const getCategories = async () => categoryRepository.findAllGlobal();

module.exports = { getCategories };
