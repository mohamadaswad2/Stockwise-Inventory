import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Boxes } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RegisterForm from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && isAuthenticated) router.replace('/dashboard'); }, [loading, isAuthenticated, router]);

  return (
    <>
      <Head><title>Create Account — StockWise</title></Head>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500 mb-4">
              <Boxes size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Get started free</h1>
            <p className="text-sm text-slate-500 mt-1">Create your StockWise account</p>
          </div>
          <div className="card p-6"><RegisterForm /></div>
        </div>
      </div>
    </>
  );
}
