/**
 * validators/inventory.validator.js — Inventory Request Schemas (Joi)
 */

const Joi = require('joi');

const createItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    'any.required': 'Item name is required',
  }),
  sku: Joi.string().trim().max(50).optional().allow('', null),
  description: Joi.string().trim().max(500).optional().allow('', null),
  quantity: Joi.number().integer().min(0).default(0),
  low_stock_threshold: Joi.number().integer().min(0).default(10),
  price: Joi.number().min(0).precision(2).default(0),
  category: Joi.string().trim().max(80).optional().allow('', null),
  unit: Joi.string().trim().max(20).default('pcs'),
});

const updateItemSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).optional(),
  sku: Joi.string().trim().max(50).optional().allow('', null),
  description: Joi.string().trim().max(500).optional().allow('', null),
  quantity: Joi.number().integer().min(0).optional(),
  low_stock_threshold: Joi.number().integer().min(0).optional(),
  price: Joi.number().min(0).precision(2).optional(),
  category: Joi.string().trim().max(80).optional().allow('', null),
  unit: Joi.string().trim().max(20).optional(),
  is_active: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

module.exports = { createItemSchema, updateItemSchema };
