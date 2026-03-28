/**
 * ThemeContext — dark by default (leonardo.ai style).
 * Toggles between dark (default) and light.
 */
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark'); // dark by default

  useEffect(() => {
    const saved = localStorage.getItem('sw-theme') || 'dark';
    setTheme(saved);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(saved);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('sw-theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
