/**
 * Centralized Tooltip Configuration
 * Multi-language support for all metric tooltips
 * 
 * Usage:
 * import { getTooltip } from '../config/tooltips.config';
 * const tooltip = getTooltip('revenue', 'ms'); // or 'en'
 */

export const TOOLTIPS = {
  // Dashboard Metrics
  totalItems: {
    ms: 'Jumlah jenis barang dalam inventori',
    en: 'Total types of items in inventory',
  },
  totalStock: {
    ms: 'Keseluruhan unit barang sedia ada',
    en: 'Total units of stock available',
  },
  lowStock: {
    ms: 'Barang yang hampir habis atau sudah habis',
    en: 'Items running low or out of stock',
  },
  inventoryValue: {
    ms: 'Nilai keseluruhan barang mengikut harga beli',
    en: 'Total value of inventory at cost price',
  },

  // Analytics & Sales Metrics
  revenue: {
    ms: 'Jumlah jualan selepas ditolak refund',
    en: 'Total sales after deducting refunds',
  },
  profit: {
    ms: 'Revenue tolak cost barang (untung kasar)',
    en: 'Revenue minus cost of goods (gross profit)',
  },
  cost: {
    ms: 'Nilai barang yang dijual (harga beli)',
    en: 'Cost of goods sold (purchase price)',
  },
  transactions: {
    ms: 'Jumlah semua aktiviti dalam tempoh ini',
    en: 'Total activities in this period',
  },
  totalRevenue: {
    ms: 'Jumlah jualan sepanjang masa',
    en: 'Total sales of all time',
  },
  last30Days: {
    ms: 'Jumlah jualan 30 hari lepas',
    en: 'Total sales in last 30 days',
  },
  unitsSold: {
    ms: 'Jumlah unit yang telah dijual',
    en: 'Total units sold',
  },
};

/**
 * Get tooltip text for a given key and language
 * @param {string} key - Tooltip key from TOOLTIPS object
 * @param {string} lang - Language code ('ms' or 'en'), defaults to 'ms'
 * @returns {string} Tooltip text or empty string if not found
 */
export const getTooltip = (key, lang = 'ms') => {
  const tooltip = TOOLTIPS[key];
  if (!tooltip) {
    console.warn(`Tooltip key "${key}" not found`);
    return '';
  }
  return tooltip[lang] || tooltip['ms'] || '';
};

/**
 * Get all tooltips for a specific language
 * @param {string} lang - Language code ('ms' or 'en')
 * @returns {Object} Object with all tooltips for the language
 */
export const getTooltipsByLanguage = (lang = 'ms') => {
  const result = {};
  Object.keys(TOOLTIPS).forEach((key) => {
    result[key] = TOOLTIPS[key][lang] || TOOLTIPS[key]['ms'];
  });
  return result;
};

export default TOOLTIPS;
