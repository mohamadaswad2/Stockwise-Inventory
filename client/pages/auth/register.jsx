import Head from 'next/head';
import { Boxes, Sparkles } from 'lucide-react';
import RegisterForm from '../../components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <>
      <Head><title>Get Started — StockWise</title></Head>
      <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1e]">
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-violet-600 to-sky-600 p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{backgroundImage:'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',backgroundSize:'40px 40px'}} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Boxes size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg">StockWise</span>
          </div>
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-white text-sm font-medium">30 Days Deluxe — FREE</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your inventory,<br />supercharged.
            </h1>
            <p className="text-violet-100 text-lg">Start your free trial today.<br />No credit card required.</p>
          </div>
          <div className="relative space-y-3">
            {['Full Deluxe access for 30 days','Real-time stock tracking','Low stock alerts & analytics','Multi-user support'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/90 text-sm">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-slide-up">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex items-center justify-center">
                <Boxes size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 dark:text-white">StockWise</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Create your account</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Start your 30-day Deluxe trial</p>
            <div className="card p-6">
              <RegisterForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
