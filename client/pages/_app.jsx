import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '13px', borderRadius: '12px', padding: '12px 16px', fontFamily: 'Inter, sans-serif' },
            success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
            error:   { style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
