import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/auth/login');
  }, [loading, isAuthenticated, router]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: 'var(--ios-bg)' }}>
      <Spinner size="lg" />
    </div>
  );

  if (!isAuthenticated) return null;
  return children;
}
