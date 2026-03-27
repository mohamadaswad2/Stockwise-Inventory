import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Boxes } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && isAuthenticated) router.replace('/dashboard'); }, [loading, isAuthenticated, router]);

  return (
    <>
      <Head><title>Sign In — StockWise</title></Head>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500 mb-4">
              <Boxes size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">StockWise</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your account</p>
          </div>
          <div className="card p-6"><LoginForm /></div>
          <p className="text-center text-xs text-slate-400 mt-6">
            Demo: <span className="font-mono">demo@inventorysaas.com</span> / <span className="font-mono">demo1234</span>
          </p>
        </div>
      </div>
    </>
  );
}
