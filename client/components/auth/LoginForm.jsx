import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OTPVerification from './OTPVerification';

export default function LoginForm() {
  const { login } = useAuth();
  const router    = useRouter();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [needOtp, setNeedOtp] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed.';
      // If email not verified → show OTP screen
      if (msg.toLowerCase().includes('verify your email')) {
        setNeedOtp(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (needOtp) {
    return <OTPVerification email={form.email} onSuccess={() => router.push('/dashboard')} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Email Address</label>
        <input name="email" type="email" autoComplete="email"
          className="input" placeholder="you@example.com"
          value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input name="password" type={showPw ? 'text' : 'password'}
            autoComplete="current-password" className="input pr-10"
            placeholder="••••••••" value={form.password} onChange={handleChange} required />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
        <LogIn size={16} />
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        No account?{' '}
        <Link href="/auth/register" className="text-sky-500 hover:underline font-medium">
          Start free trial
        </Link>
      </p>
    </form>
  );
}
