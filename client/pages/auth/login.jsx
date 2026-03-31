import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import OTPVerification from '../../components/auth/OTPVerification';
import { useAuth } from '../../contexts/AuthContext';

const noSpaces = v => v.replace(/\s/g, '');

export default function LoginPage() {
  const { completeVerification } = useAuth();
  const router   = useRouter();
  const [email,   setEmail]   = useState('');
  const [password,setPassword]= useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [needOtp, setNeedOtp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API}/auth/login`, { email, password });
      const { user, token } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      completeVerification(user, token);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || '';
      if (status === 403 && message.toLowerCase().includes('verify')) {
        toast('Please verify your email first.', { icon: '📧' });
        setNeedOtp(true);
      } else if (status === 403 && message.toLowerCase().includes('locked')) {
        toast.error('Account locked. Please contact support or renew your subscription.');
      } else {
        toast.error(message || 'Login failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Sign In — StockWise</title></Head>
      <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
        {/* Left brand panel — hidden on mobile */}
        <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg,#007aff 0%,#5856d6 100%)' }}>
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ background: 'rgba(255,255,255,0.2)' }}>SW</div>
            <span className="text-white font-bold text-lg">StockWise</span>
          </div>
          <div className="relative">
            <h1 className="text-4xl font-black text-white leading-tight mb-3" style={{ letterSpacing: '-1px' }}>
              Manage inventory<br />like a pro.
            </h1>
            <p className="text-blue-100 text-lg">Real-time tracking, smart alerts,<br />powerful analytics.</p>
          </div>
          <div className="relative flex gap-8">
            {[['500+','Users'],['99.9%','Uptime'],['30-day','Free Trial']].map(([v,l]) => (
              <div key={l}><p className="text-2xl font-bold text-white">{v}</p><p className="text-blue-200 text-sm">{l}</p></div>
            ))}
          </div>
        </div>

        {/* Right form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-ios-in">
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>SW</div>
              <span className="font-bold text-lg" style={{ color: 'var(--text)' }}>StockWise</span>
            </div>

            {needOtp ? (
              <>
                <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>Verify your email</h2>
                <div className="card-glow p-6">
                  <OTPVerification email={email} onSuccess={() => router.push('/dashboard')} onBack={() => setNeedOtp(false)} />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>Welcome back</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>Sign in to your account</p>
                <div className="card-glow p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="label">Email</label>
                      <input type="email" className="input" placeholder="you@example.com"
                        value={email} onChange={e => setEmail(e.target.value)}
                        autoComplete="email" inputMode="email" required />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input type={showPw ? 'text' : 'password'} className="input pr-11"
                          placeholder="••••••••"
                          value={password}
                          onChange={e => setPassword(noSpaces(e.target.value))} // #7 fix — no spaces
                          autoComplete="current-password" required />
                        <button type="button" onClick={() => setShowPw(v=>!v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                          style={{ color: 'var(--text3)' }}>
                          {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link href="/auth/forgot-password" className="text-xs font-medium" style={{ color: 'var(--accent3)' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary w-full">
                      {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                    <p className="text-center text-sm" style={{ color: 'var(--text2)' }}>
                      No account?{' '}
                      <Link href="/auth/register" className="font-bold" style={{ color: 'var(--accent3)' }}>Start free trial</Link>
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
