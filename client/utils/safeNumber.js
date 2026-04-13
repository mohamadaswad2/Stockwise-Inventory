/**
 * Safe number parsing utility
 * Handles NaN, Infinity, -Infinity, null, undefined
 * Returns 0 for all invalid values
 */

export const safeNumber = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  
  const num = Number(value);
  
  // Check for NaN, Infinity, -Infinity
  if (!isFinite(num)) return defaultValue;
  
  return num;
};

/**
 * Safe number formatting for currency
 * Uses safeNumber internally then applies formatting
 */
export const safeCurrency = (value, formatFn) => {
  const num = safeNumber(value, 0);
  return formatFn(num);
};
