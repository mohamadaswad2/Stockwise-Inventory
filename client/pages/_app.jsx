import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { CurrencyProvider } from '../contexts/CurrencyContext';
import CookieConsent from '../components/ui/CookieConsent';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <Component {...pageProps} />
          <CookieConsent />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '13px',
                borderRadius: '12px',
                padding: '12px 16px',
                fontFamily: 'Inter, sans-serif',
                background: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              },
              success: { iconTheme: { primary: '#22c55e', secondary: 'white' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: 'white' } },
            }}
          />
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
