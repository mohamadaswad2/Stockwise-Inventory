/**
 * CurrencyContext — global currency switcher (MYR / USD).
 * Persists to localStorage. All price displays use useCurrency() hook.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CurrencyContext = createContext(null);

// Exchange rate — in production, fetch from an API like exchangerate-api.com
const RATES = {
  MYR: 1,
  USD: 0.21,  // 1 MYR = ~0.21 USD (update periodically)
};

const SYMBOLS = {
  MYR: 'RM',
  USD: '$',
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MYR');

  useEffect(() => {
    const saved = localStorage.getItem('sw-currency') || 'MYR';
    setCurrency(saved);
  }, []);

  const switchCurrency = useCallback((code) => {
    setCurrency(code);
    localStorage.setItem('sw-currency', code);
  }, []);

  /**
   * Format a MYR value into the selected currency.
   * @param {number} amountMYR - Amount in MYR
   * @param {number} decimals  - Decimal places (default 2)
   */
  const format = useCallback((amountMYR, decimals = 2) => {
    if (amountMYR === null || amountMYR === undefined) return '—';
    const converted = Number(amountMYR) * RATES[currency];
    return `${SYMBOLS[currency]}${converted.toFixed(decimals)}`;
  }, [currency]);

  /**
   * Format with thousand separators.
   */
  const formatFull = useCallback((amountMYR) => {
    if (amountMYR === null || amountMYR === undefined) return '—';
    const converted = Number(amountMYR) * RATES[currency];
    return `${SYMBOLS[currency]}${converted.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, [currency]);

  return (
    <CurrencyContext.Provider value={{
      currency,
      symbol: SYMBOLS[currency],
      rate: RATES[currency],
      currencies: Object.keys(RATES),
      switchCurrency,
      format,
      formatFull,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
};
