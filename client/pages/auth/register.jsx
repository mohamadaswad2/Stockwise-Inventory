import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { LogoIcon } from '../../components/ui/Logo';
import RegisterForm from '../../components/auth/RegisterForm';

/* ── Left visual panel ───────────────────────────────────────────────────── */
function LeftPanel() {
  const PERKS = [
    { icon: '📦', text: 'Real-time inventory tracking' },
    { icon: '🔔', text: 'Smart low-stock email alerts' },
    { icon: '📊', text: 'Sales analytics & profit reports' },
    { icon: '⚡', text: 'Quick Sell — record sales in 2 taps' },
  ];

  return (
    <div className="auth-panel-left hidden lg:flex flex-col justify-between"
      style={{ width: '44%', padding: '48px 52px', flexShrink: 0 }}>

      {/* Mesh glow orbs */}
      <div style={{ position: 'absolute', top: -80, right: -60, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,91,214,0.3) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -40, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', left: '20%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Grid */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoIcon size={38} />
        <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.4px' }}>StockWise</span>
      </div>

      {/* Main copy */}
      <div style={{ position: 'relative' }}>
        {/* Trial badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 99, background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 24 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>✨ 30-Day Deluxe Free Trial</span>
        </div>

        <h1 style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, color: '#fff', lineHeight: 1.08, letterSpacing: '-1.5px', marginBottom: 14 }}>
          Your inventory,<br />
          <span style={{ background: 'linear-gradient(135deg,#22c55e,#3dd68c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            supercharged.
          </span>
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 32 }}>
          No credit card required.<br />Full access, cancel anytime.
        </p>

        {/* Perk list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {PERKS.map((p, i) => (
            <div key={p.text} className="auth-badge"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderRadius: 12,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                animationDelay: `${i * 0.35}s`,
              }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{p.text}</span>
              <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: 'rgba(34,197,94,0.25)', border: '1px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5.5L4 7.5L8 3" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div style={{ position: 'relative', display: 'flex', gap: 28 }}>
        {[['Free', 'No credit card'], ['30 days', 'Full Deluxe'], ['< 5 min', 'To first sale']].map(([v, l], i) => (
          <div key={l} className="auth-stat">
            <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>{v}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function RegisterPage() {
  const { user } = useAuth();
  const router   = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [user, router]);

  return (
    <>
      <Head><title>Get Started — StockWise</title></Head>

      {/* Cloudflare Turnstile — only on register page */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad"
          strategy="lazyOnload"
        />
      )}

      <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

        {/* Left visual panel — desktop only */}
        <LeftPanel />

        {/* Right form panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,60px)', overflowY: 'auto' }}>

          <div className="auth-form-wrap" style={{ width: '100%', maxWidth: 380 }}>

            {/* Mobile logo */}
            <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <LogoIcon size={34} />
              <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)', letterSpacing: '-0.3px' }}>StockWise</span>
            </div>

            {/* Mobile trial badge */}
            <div className="lg:hidden" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 99, background: 'var(--green-bg)', border: '1px solid rgba(61,214,140,0.25)', marginBottom: 18, fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>
              ✨ 30-Day Deluxe Free Trial
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.6px', marginBottom: 6 }}>
                Create your account
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                Start your free trial — no credit card needed
              </p>
            </div>

            {/* Form */}
            <div className="card" style={{ padding: 22 }}>
              <RegisterForm />
            </div>

            {/* Footer note */}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 16, lineHeight: 1.6 }}>
              By creating an account, you agree to our{' '}
              <a href="/terms" style={{ color: 'var(--accent3)', textDecoration: 'none' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" style={{ color: 'var(--accent3)', textDecoration: 'none' }}>Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
