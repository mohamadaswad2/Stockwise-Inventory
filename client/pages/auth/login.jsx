import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import OTPVerification from '../../components/auth/OTPVerification';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { completeVerification } = useAuth();
  const router   = useRouter();
  const [form,   setForm]   = useState({ email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading,setLoading]= useState(false);
  const [needOtp,setNeedOtp]= useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call API directly — bypass AuthContext.login() to see raw error
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API}/auth/login`, form);

      // Success — store token manually
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      completeVerification(user, token);
      toast.success('Welcome back!');
      router.push('/dashboard');

    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || '';

      // Debug: always show what we got
      console.error('[Login Error]', { status, message });

      if (status === 403) {
        // ANY 403 from login = email not verified
        toast('Please verify your email to continue.', { icon: '📧', duration: 5000 });
        setNeedOtp(true);
      } else if (status === 401) {
        toast.error('Incorrect email or password.');
      } else if (status === 400) {
        toast.error(message || 'Invalid request.');
      } else {
        toast.error(message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Sign In — StockWise</title></Head>
      <div className="min-h-screen flex" style={{ background: 'var(--ios-bg)' }}>

        {/* Left brand panel */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#007aff 0%,#5856d6 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
              SW
            </div>
            <span className="text-white font-bold text-lg">StockWise</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              Manage inventory<br />like a pro.
            </h1>
            <p className="text-blue-100 text-lg">Real-time tracking, smart alerts,<br />powerful analytics.</p>
          </div>
          <div className="relative flex gap-8">
            {[['500+','Users'],['99.9%','Uptime'],['30-day','Free Trial']].map(([v,l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-white">{v}</p>
                <p className="text-blue-200 text-sm">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-ios-in">

            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>SW</div>
              <span className="font-bold" style={{ color: 'var(--ios-text)' }}>StockWise</span>
            </div>

            {needOtp ? (
              <>
                <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ios-text)' }}>Verify your email</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--ios-text2)' }}>
                  Enter the code sent to <strong>{form.email}</strong>
                </p>
                <div className="card p-6">
                  <OTPVerification
                    email={form.email}
                    onSuccess={() => router.push('/dashboard')}
                    onBack={() => setNeedOtp(false)}
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--ios-text)' }}>Welcome back</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--ios-text2)' }}>Sign in to your account</p>

                <div className="card p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input" placeholder="you@example.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        autoComplete="email" required />
                    </div>

                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} className="input pr-11"
                          placeholder="••••••••"
                          value={form.password}
                          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                          autoComplete="current-password" required />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl"
                          style={{ color: 'var(--ios-text2)' }}>
                          {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Link href="/auth/forgot-password" className="text-xs font-medium"
                        style={{ color: 'var(--ios-blue)' }}>
                        Forgot password?
                      </Link>
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>

                    <p className="text-center text-sm" style={{ color: 'var(--ios-text2)' }}>
                      No account?{' '}
                      <Link href="/auth/register" className="font-semibold" style={{ color: 'var(--ios-blue)' }}>
                        Start free trial
                      </Link>
                    </p>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
