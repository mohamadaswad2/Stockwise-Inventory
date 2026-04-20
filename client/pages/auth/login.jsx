import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Eye, EyeOff, ArrowLeft, LayoutDashboard } from 'lucide-react';
import toast from 'react-hot-toast';
import OTPVerification from '../../components/auth/OTPVerification';
import { useAuth } from '../../contexts/AuthContext';
import { LogoIcon } from '../../components/ui/Logo';

const noSpaces = v => v.replace(/\s/g, '');

/* ── Left visual panel ───────────────────────────────────────────────────── */
function LeftPanel() {
  return (
    <div className="auth-panel-left hidden lg:flex flex-col justify-between"
      style={{ width: '44%', padding: '48px 52px', flexShrink: 0 }}>

      {/* Mesh glow orbs */}
      <div style={{ position: 'absolute', top: -120, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,91,214,0.35) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: -40, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoIcon size={38} />
        <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.4px' }}>StockWise</span>
      </div>

      {/* Main copy */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 14px', borderRadius: 99, background: 'rgba(91,91,214,0.3)', border: '1px solid rgba(123,123,248,0.3)', marginBottom: 24 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>All systems operational</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 16 }}>
          Manage inventory<br />
          <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            like a pro.
          </span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, maxWidth: 320 }}>
          Real-time stock tracking, smart alerts,<br />and powerful analytics — all in one place.
        </p>

        {/* Feature badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
          {['📦 Real-time tracking', '🔔 Low stock alerts', '📊 Profit analytics', '⚡ Quick Sell'].map((f, i) => (
            <span key={f} className="auth-badge"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.8)',
                animationDelay: `${i * 0.4}s`,
              }}>{f}</span>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ position: 'relative', display: 'flex', gap: 32 }}>
        {[['30-day', 'Free Trial'], ['99.9%', 'Uptime SLA'], ['< 5min', 'Setup Time']].map(([v, l], i) => (
          <div key={l} className="auth-stat">
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{v}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [needOtp,  setNeedOtp]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const status  = err.response?.status;
      const message = err.response?.data?.message || '';
      if (status === 403 && message.toLowerCase().includes('verify')) {
        toast('Please verify your email first.', { icon: '📧' });
        setNeedOtp(true);
      } else if (status === 403 && message.toLowerCase().includes('locked')) {
        toast.error('Account locked. Please renew your subscription or contact support.');
      } else {
        toast.error(message || 'Login failed. Please check your credentials.');
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <Head><title>Sign In — StockWise</title></Head>

      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

        {/* Left visual panel — desktop only */}
        <LeftPanel />

        {/* Right form panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,60px)', position: 'relative' }}>

          {/* Back to dashboard — top right */}
          {user && (
            <Link href="/dashboard"
              style={{ position: 'absolute', top: 20, right: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500, color: 'var(--text3)', textDecoration: 'none', padding: '7px 12px', borderRadius: 9, background: 'var(--surface2)', border: '1px solid var(--border)', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
              <LayoutDashboard size={14} /> Dashboard
            </Link>
          )}

          <div className="auth-form-wrap" style={{ width: '100%', maxWidth: 380 }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
              <LogoIcon size={34} />
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' }}>StockWise</span>
            </div>

            {needOtp ? (
              /* OTP step */
              <div>
                <div style={{ marginBottom: 24 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 }}>
                    Check your email
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                    Enter the 6-digit code sent to <strong style={{ color: 'var(--text2)' }}>{email}</strong>
                  </p>
                </div>
                <div className="card" style={{ padding: 24 }}>
                  <OTPVerification
                    email={email}
                    onSuccess={() => router.push('/dashboard')}
                    onBack={() => setNeedOtp(false)}
                  />
                </div>
              </div>
            ) : (
              /* Login form */
              <div>
                <div style={{ marginBottom: 28 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.6px', marginBottom: 6 }}>
                    Welcome back
                  </h2>
                  <p style={{ fontSize: 13, color: 'var(--text3)' }}>Sign in to your StockWise account</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                      Email address
                    </label>
                    <input
                      type="email" required
                      className="input input-focus-ring"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      autoComplete="email"
                      style={{ height: 44 }}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>Password</label>
                      <Link href="/auth/forgot-password"
                        style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent3)', textDecoration: 'none' }}>
                        Forgot password?
                      </Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPw ? 'text' : 'password'} required
                        className="input input-focus-ring"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(noSpaces(e.target.value))}
                        autoComplete="current-password"
                        style={{ height: 44, paddingRight: 44 }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={loading}
                    style={{
                      height: 46, borderRadius: 12, fontSize: 14, fontWeight: 700,
                      background: loading ? 'var(--accent-bg)' : 'var(--accent)',
                      color: loading ? 'var(--accent3)' : '#fff',
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 200ms ease',
                      boxShadow: loading ? 'none' : '0 4px 16px rgba(91,91,214,0.35)',
                      marginTop: 4,
                    }}
                    onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 22px rgba(91,91,214,0.5)'; }}
                    onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 16px rgba(91,91,214,0.35)'; }}>
                    {loading ? (
                      <>
                        <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--accent3)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                        Signing in…
                      </>
                    ) : 'Sign In'}
                  </button>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>New to StockWise?</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>

                  {/* Register CTA */}
                  <Link href="/auth/register"
                    style={{
                      height: 44, borderRadius: 12, fontSize: 13, fontWeight: 600,
                      background: 'var(--surface2)', color: 'var(--text2)',
                      border: '1px solid var(--border)', textDecoration: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}>
                    Start free trial — 30 days Deluxe ✨
                  </Link>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
