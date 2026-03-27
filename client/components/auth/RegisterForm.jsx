import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import * as authService from '../../services/auth.service';
import OTPVerification from './OTPVerification';

const checks = [
  { label: 'Minimum 8 characters',       test: (p) => p.length >= 8 },
  { label: 'Uppercase letter (A-Z)',      test: (p) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a-z)',      test: (p) => /[a-z]/.test(p) },
  { label: 'Number (0-9)',               test: (p) => /[0-9]/.test(p) },
  { label: 'Special character (!@#...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = checks.filter(c => c.test(password)).length;
  const pct    = (passed / checks.length) * 100;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];
  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: colors[passed - 1] || '#e2e8f0' }} />
        </div>
        <span className="text-xs font-medium" style={{ color: colors[passed - 1] || '#94a3b8' }}>
          {labels[passed - 1] || 'Too Weak'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1">
        {checks.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-1.5">
              {ok
                ? <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />
                : <XCircle    size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />}
              <span className={`text-xs ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {c.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('register'); // 'register' | 'verify'

  const isStrong = checks.every(c => c.test(form.password));

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong) { toast.error('Please meet all password requirements.'); return; }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success('Account created! Check your email for verification code.');
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return <OTPVerification email={form.email} onSuccess={() => router.push('/dashboard')} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input name="name" type="text" className="input" placeholder="Ahmad Rizal"
          value={form.name} onChange={handleChange} required />
      </div>
      <div>
        <label className="label">Email Address</label>
        <input name="email" type="email" className="input" placeholder="you@example.com"
          value={form.email} onChange={handleChange} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input name="password" type={showPw ? 'text' : 'password'} className="input pr-10"
            placeholder="Create a strong password" value={form.password} onChange={handleChange} required />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>

      {/* Trial banner */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 border border-sky-100 dark:border-sky-800">
        <ShieldCheck size={18} className="text-sky-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-sky-700 dark:text-sky-300">
          <strong>30 days Deluxe FREE</strong> — all features unlocked. No credit card required.
        </p>
      </div>

      <button type="submit" disabled={loading || !isStrong}
        className="btn-primary w-full justify-center">
        <UserPlus size={16} />
        {loading ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-sky-500 hover:underline font-medium">Sign in</Link>
      </p>
    </form>
  );
}
