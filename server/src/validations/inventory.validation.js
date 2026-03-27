/**
 * Joi schemas for inventory item endpoints.
 *
 * FIXED: low_stock dalam listQuery kena handle string "true"/"false"
 * sebab query params dari URL sentiasa datang sebagai string.
 */
const Joi = require('joi');

const createItem = Joi.object({
  name:                Joi.string().min(1).max(255).required(),
  sku:                 Joi.string().max(100).optional().allow('', null),
  description:         Joi.string().max(1000).optional().allow('', null),
  quantity:            Joi.number().integer().min(0).required(),
  unit:                Joi.string().max(50).default('unit'),
  price:               Joi.number().min(0).precision(2).required(),
  low_stock_threshold: Joi.number().integer().min(0).default(5),
  category_id:         Joi.string().uuid().optional().allow('', null),
});

const updateItem = Joi.object({
  name:                Joi.string().min(1).max(255),
  sku:                 Joi.string().max(100).allow('', null),
  description:         Joi.string().max(1000).allow('', null),
  quantity:            Joi.number().integer().min(0),
  unit:                Joi.string().max(50),
  price:               Joi.number().min(0).precision(2),
  low_stock_threshold: Joi.number().integer().min(0),
  category_id:         Joi.string().uuid().allow('', null),
  is_active:           Joi.boolean(),
}).min(1);

const listQuery = Joi.object({
  page:        Joi.number().integer().min(1).default(1),
  limit:       Joi.number().integer().min(1).max(100).default(20),
  search:      Joi.string().max(100).optional().allow(''),
  category_id: Joi.string().uuid().optional().allow(''),
  // truthy() supaya string "true" dan boolean true kedua-duanya diterima
  low_stock:   Joi.boolean().truthy('true').falsy('false').optional(),
});

module.exports = { createItem, updateItem, listQuery };
