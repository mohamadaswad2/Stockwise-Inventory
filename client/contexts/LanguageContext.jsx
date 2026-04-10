import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import en from '../locales/en';
import ms from '../locales/ms';

const LOCALES = { en, ms };
const LanguageContext = createContext(null);

// Detect language from browser, fallback to 'en'
const detectLang = () => {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('sw_lang');
  if (stored && LOCALES[stored]) return stored;
  const browser = navigator.language?.split('-')[0]?.toLowerCase();
  return (browser === 'ms' || browser === 'id') ? 'ms' : 'en';
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en'); // safe default for SSR

  // Hydrate from localStorage after mount
  useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = useCallback((l) => {
    if (!LOCALES[l]) return;
    setLangState(l);
    localStorage.setItem('sw_lang', l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === 'en' ? 'ms' : 'en');
  }, [lang, setLang]);

  // t(key) — e.g. t('nav.dashboard') → 'Papan Pemuka'
  // Falls back to English if translation missing
  const t = useCallback((key) => {
    const keys = key.split('.');
    let val = LOCALES[lang];
    let fallback = LOCALES['en'];
    for (const k of keys) {
      val = val?.[k];
      fallback = fallback?.[k];
    }
    return val ?? fallback ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
