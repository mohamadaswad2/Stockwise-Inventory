import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react';
import * as authService from '../../services/auth.service';
import OTPVerification from './OTPVerification';

const CHECKS = [
  { label: 'At least 8 characters',    test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',             test: p => /[0-9]/.test(p) },
  { label: 'Special character (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_COLORS = ['#f2555a', '#ff8b3e', '#ff8b3e', '#3dd68c', '#7b7bf8'];
const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

function PasswordStrength({ password }) {
  if (!password) return null;
  const passed = CHECKS.filter(c => c.test(password)).length;
  const pct    = Math.round((passed / CHECKS.length) * 100);
  const color  = STRENGTH_COLORS[passed - 1] || 'var(--border2)';
  const label  = STRENGTH_LABELS[passed - 1] || 'Too Weak';

  return (
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Bar + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 400ms ease, background 400ms ease' }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 68, textAlign: 'right' }}>{label}</span>
      </div>
      {/* Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {CHECKS.map(c => {
          const ok = c.test(password);
          return (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {ok
                ? <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                : <Circle       size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
              <span style={{ fontSize: 11, color: ok ? 'var(--green)' : 'var(--text3)', transition: 'color 200ms' }}>
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
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (step === 'verify') {
    return <OTPVerification email={form.email} onSuccess={() => router.push('/dashboard')} />;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Name */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
          Full Name
        </label>
        <input type="text" required
          className="input input-focus-ring"
          placeholder="Ahmad Rizal"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          autoComplete="name"
          style={{ height: 44 }}
        />
      </div>

      {/* Email */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
          Email address
        </label>
        <input type="email" required
          className="input input-focus-ring"
          placeholder="you@example.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          autoComplete="email"
          style={{ height: 44 }}
        />
      </div>

      {/* Password */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'} required
            className="input input-focus-ring"
            placeholder="Create a strong password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
            style={{ height: 44, paddingRight: 44 }}
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>

      {/* Trial badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '10px 13px', borderRadius: 10,
        background: 'var(--accent-bg)', border: '1px solid var(--accent-border)',
        fontSize: 12, color: 'var(--accent3)',
      }}>
        <span style={{ fontSize: 16 }}>✨</span>
        <span>
          <strong>30 days Deluxe FREE</strong> — all features unlocked. No credit card needed.
        </span>
      </div>

      {/* Submit */}
      <button type="submit" disabled={loading || !isStrong}
        style={{
          height: 46, borderRadius: 12, fontSize: 14, fontWeight: 700,
          background: !isStrong ? 'var(--surface2)' : loading ? 'var(--accent-bg)' : 'var(--accent)',
          color: !isStrong ? 'var(--text3)' : loading ? 'var(--accent3)' : '#fff',
          border: !isStrong ? '1px solid var(--border)' : 'none',
          cursor: loading || !isStrong ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 250ms ease',
          boxShadow: isStrong && !loading ? '0 4px 16px rgba(91,91,214,0.35)' : 'none',
        }}>
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--accent3)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
            Creating account…
          </>
        ) : isStrong ? 'Create Account →' : 'Meet password requirements'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text3)' }}>
        Already have an account?{' '}
        <Link href="/auth/login" style={{ fontWeight: 600, color: 'var(--accent3)', textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </form>
  );
}
