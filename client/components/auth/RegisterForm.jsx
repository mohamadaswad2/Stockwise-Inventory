import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import OTPVerification from './OTPVerification';

const CHECKS = [
  { label: 'At least 8 characters',    test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',             test: p => /[0-9]/.test(p) },
  { label: 'Special character (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

function StrengthMeter({ password }) {
  if (!password) return null;
  const passed = CHECKS.filter(c => c.test(password)).length;
  const colors = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#6366f1'];
  const labels = ['Very Weak','Weak','Fair','Strong','Very Strong'];
  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--surface3)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(passed/CHECKS.length)*100}%`, background: colors[passed-1]||'transparent' }} />
        </div>
        <span className="text-xs font-semibold w-20 text-right"
          style={{ color: colors[passed-1]||'var(--text3)' }}>
          {labels[passed-1]||'Too Weak'}
        </span>
      </div>
      <div className="space-y-1">
        {CHECKS.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.label} className="flex items-center gap-2">
              {ok ? <CheckCircle2 size={12} style={{color:'var(--green)',flexShrink:0}}/>
                  : <Circle      size={12} style={{color:'var(--text3)',flexShrink:0}}/>}
              <span className="text-xs" style={{color: ok?'var(--green)':'var(--text2)'}}>{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [form,    setForm]    = useState({ name:'', email:'', password:'' });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState('register');
  const isStrong = CHECKS.every(c => c.test(form.password));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrong) { toast.error('Password does not meet all requirements.'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Check your email.');
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  if (step === 'verify') return (
    <OTPVerification email={form.email}
      onSuccess={() => router.push('/dashboard')}
      onBack={() => setStep('register')} />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Full Name</label>
        <input type="text" className="input" placeholder="Ahmad Rizal"
          value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} required />
      </div>
      <div>
        <label className="label">Email Address</label>
        <input type="email" className="input" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} required />
      </div>
      <div>
        <label className="label">Password</label>
        <div className="relative">
          <input type={showPw?'text':'password'} className="input pr-11"
            placeholder="Create a strong password"
            value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} required />
          <button type="button" onClick={() => setShowPw(v=>!v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text3)' }}>
            {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
          </button>
        </div>
        <StrengthMeter password={form.password} />
      </div>

      <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
        <span className="text-base flex-shrink-0">✨</span>
        <span style={{ color: 'var(--accent3)' }}>
          <strong>30 days Deluxe FREE</strong> — all features unlocked. No credit card required.
        </span>
      </div>

      <button type="submit" disabled={loading || !isStrong} className="btn-primary w-full">
        {loading ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--text2)' }}>
        Have an account?{' '}
        <Link href="/auth/login" className="font-semibold" style={{ color: 'var(--accent3)' }}>Sign in</Link>
      </p>
    </form>
  );
}
