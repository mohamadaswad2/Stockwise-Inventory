import Head from 'next/head';
import Link from 'next/link';
import { Boxes } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';

export default function LoginPage() {
  return (
    <>
      <Head><title>Sign In — StockWise</title></Head>
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1e]">
        {/* Left panel — branding */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-sky-600 to-blue-700 p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',backgroundSize:'40px 40px'}} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Boxes size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">StockWise</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your inventory<br />like a pro.
            </h1>
            <p className="text-sky-100 text-lg">Real-time tracking, smart alerts,<br />and powerful analytics.</p>
          </div>
          <div className="relative flex gap-6">
            {[['500+','Active Users'],['99.9%','Uptime'],['30-day','Free Trial']].map(([v,l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-white">{v}</p>
                <p className="text-sky-200 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
                <Boxes size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">StockWise</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Sign in to your account</p>
            <div className="card p-6">
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
