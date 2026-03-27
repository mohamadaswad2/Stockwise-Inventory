/**
 * Root page — redirects to /dashboard if authenticated, else /auth/login.
 */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import Spinner from '../components/ui/Spinner';

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(isAuthenticated ? '/dashboard' : '/auth/login');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
