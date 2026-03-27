/**
 * Next.js custom App — mounts AuthProvider and toast notifications.
 */
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '13px', borderRadius: '10px', padding: '10px 14px' },
        }}
      />
    </AuthProvider>
  );
}
