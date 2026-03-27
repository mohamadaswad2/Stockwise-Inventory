import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import * as authService from '../../services/auth.service';
import OTPVerification from './OTPVerification';

const CHECKS = [
  { label: 'At least 8 characters',     test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',     test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',     test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',              test: p => /[0-9]/.test(p) },
  { label: 'Special character (!@#…)',  test: p => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = CHECKS.filter(c => c.test(password)).length;
  const pct    = Math.round((passed / CHECKS.length) * 100);
  const colors = ['#ff3b30','#ff9500','#ff9500','#34c759','#007aff'];
  const labels = ['Very Weak','Weak','Fair','Strong','Very Strong'];

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ios-surface2)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: colors[passed - 1] || '#3f3f46' }} />
        </div>
        <span className="text-xs font-semibold w-20 text-right"
          style={{ color: colors[passed - 1] || 'var(--ios-text3)' }}>
          {labels[passed - 1] || 'Too Weak'}
        </span>
      </div>
      <div className="space-y-1">
        {CHECKS.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-2">
              {ok
                ? <CheckCircle2 size={13} style={{ color: 'var(--ios-green)', flexShrink: 0 }} />
                : <Circle      size={13} style={{ color: 'var(--ios-text3)', flexShrink: 0 }} />}
              <span className="text-xs" style={{ color: ok ? 'var(--ios-green)' : 'var(--ios-text2)' }}>
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
  const [form,    setForm]    = useState({ name:'', email:'', password:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('register');

  const isStrong = CHECKS.every(c => c.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong) { toast.error('Please meet all password requirements.'); return; }
    setLoading(true);
    try {
      await authService.register(form);
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (step === 'verify') {
    return <OTPVerification email={form.email} onSuccess={() => router.push('/dashboard')} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input type="text" className="input" placeholder="Ahmad Rizal"
          value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
      </div>
      <div>
        <label className="label">Email</label>
        <input type="email" className="input" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input type={showPw ? 'text' : 'password'} className="input pr-11"
            placeholder="Create strong password"
            value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required />
          <button type="button" onClick={() => setShowPw(v=>!v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl"
            style={{ color: 'var(--ios-text2)' }}>
            {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>

      {/* Trial badge */}
      <div className="flex items-center gap-2 p-3 rounded-2xl text-xs"
        style={{ background: 'rgba(0,122,255,0.08)', color: 'var(--ios-blue)' }}>
        ✨ <span><strong>30 days Deluxe FREE</strong> — all features unlocked. No card needed.</span>
      </div>

      <button type="submit" disabled={loading || !isStrong} className="btn-primary w-full">
        {loading ? 'Creating…' : 'Create Account'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--ios-text2)' }}>
        Have an account?{' '}
        <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--ios-blue)' }}>Sign in</Link>
      </p>
    </form>
  );
}
