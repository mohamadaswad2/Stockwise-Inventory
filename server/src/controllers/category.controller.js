/**
 * Category controller — read-only untuk user.
 * Hanya GET categories, tiada create/delete.
 */
const categoryService = require('../services/category.service');
const { success } = require('../utils/response');

const getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getCategories();
    success(res, { categories });
  } catch (err) { next(err); }
};

module.exports = { getCategories };
