/**
 * CurrencyContext — auto-fetching exchange rates from open API.
 * Uses exchangerate-api.com free tier (no key needed for basic rates).
 * Falls back to hardcoded rates if API unavailable.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CurrencyContext = createContext(null);

const FALLBACK_RATES = { MYR: 1, USD: 0.2134 };
const SYMBOLS = { MYR: 'RM', USD: '$' };

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MYR');
  const [rates,    setRates]    = useState(FALLBACK_RATES);
  const [rateDate, setRateDate] = useState(null);

  // Fetch live rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Free API — no key needed, updates daily
        const res  = await fetch('https://api.exchangerate-api.com/v4/latest/MYR');
        const data = await res.json();
        if (data?.rates) {
          setRates({ MYR: 1, USD: data.rates.USD || FALLBACK_RATES.USD });
          setRateDate(data.date || new Date().toISOString().slice(0,10));
        }
      } catch {
        // Silent fail — use fallback rates
        setRateDate('offline');
      }
    };
    fetchRates();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('sw-currency') || 'MYR';
    setCurrency(saved);
  }, []);

  const switchCurrency = useCallback((code) => {
    setCurrency(code);
    localStorage.setItem('sw-currency', code);
  }, []);

  // Helper to strip trailing zeros for cleaner display
  const stripTrailingZeros = (num) => {
    const str = num.toString();
    if (str.indexOf('.') === -1) return str;
    return str.replace(/\.?0+$/, '');
  };

  const format = useCallback((amountMYR, decimals = 2) => {
    if (amountMYR === null || amountMYR === undefined) return '—';
    const converted = Number(amountMYR) * (rates[currency] || 1);
    // Use toFixed then strip trailing zeros for clean display
    const fixed = converted.toFixed(decimals);
    return `${SYMBOLS[currency]}${stripTrailingZeros(fixed)}`;
  }, [currency, rates]);

  const formatFull = useCallback((amountMYR) => {
    if (amountMYR === null || amountMYR === undefined) return '—';
    const converted = Number(amountMYR) * (rates[currency] || 1);
    // Strip trailing zeros while keeping thousand separators
    const withSeparators = converted.toLocaleString('en-MY', {
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
    return `${SYMBOLS[currency]}${withSeparators}`;
  }, [currency, rates]);

  return (
    <CurrencyContext.Provider value={{
      currency, symbol: SYMBOLS[currency], rate: rates[currency] || 1,
      currencies: Object.keys(SYMBOLS), rateDate,
      switchCurrency, format, formatFull,
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
