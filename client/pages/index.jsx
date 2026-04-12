/**
 * Root page — Landing page for non-authenticated users.
 * Authenticated users are redirected to /dashboard automatically.
 */
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

// ─── Lightweight fade-in hook — IntersectionObserver, zero deps ───────────────
function useFadeIn(opts = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.12, ...opts });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '📦', title: 'Real-Time Stock Tracking',   color: '#6366f1', desc: 'Know your stock levels the moment they change. No more manual counting or spreadsheet guesswork.' },
  { icon: '📊', title: 'Sales & Profit Analytics',   color: '#8b5cf6', desc: 'See exactly what\'s making you money. Revenue, cost, and margin — all in one clean dashboard.' },
  { icon: '🔔', title: 'Low Stock Alerts',           color: '#a855f7', desc: 'Get email alerts before you run out. Never lose a sale because of an empty shelf again.' },
  { icon: '⚡', title: 'Quick Sell in 2 Taps',       color: '#7c3aed', desc: 'Record a sale in seconds from any device. No complicated forms, no training needed.' },
  { icon: '📁', title: 'CSV Export',                 color: '#6d28d9', desc: 'Pull your inventory data anytime. Share with your accountant or import to any tool.' },
  { icon: '🌙', title: 'Works Day & Night',          color: '#5b21b6', desc: 'Light and dark mode that adapts to you. Comfortable on the eyes at 2AM stock-takes.' },
];

const PAIN_SOLUTIONS = [
  { pain: 'Spreadsheets that break when 2 people edit',      fix: 'One source of truth, always up to date' },
  { pain: 'Finding out you\'re out of stock way too late',   fix: 'Automatic alerts before you hit zero' },
  { pain: 'No idea which products are actually profitable',  fix: 'See margin on every single item instantly' },
  { pain: 'Hours wasted on manual stock counts',             fix: 'Real-time tracking, zero manual work' },
];

const PLANS = [
  { name: 'Starter', price: 'RM 19', color: '#22c55e', features: ['500 inventory items','CSV export (3×/month)','Low stock email alerts','Dashboard analytics'] },
  { name: 'Premium', price: 'RM 39', color: '#8b5cf6', popular: true, features: ['Unlimited inventory items','Advanced sales analytics','Profit & cost tracking','Priority support'] },
  { name: 'Deluxe',  price: 'RM 69', color: '#6366f1', features: ['Everything in Premium','Full analytics suite (3M)','Unlimited CSV exports','Early access features'] },
];

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 24px', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(5,5,15,0.88)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '15px', fontWeight: 800, color: '#fff', flexShrink: 0,
        }}>S</div>
        <span style={{ fontWeight: 700, fontSize: '17px', color: '#fff', letterSpacing: '-0.3px' }}>
          StockWise
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/auth/login" style={{
          color: 'rgba(255,255,255,0.65)', fontSize: '14px', fontWeight: 500,
          textDecoration: 'none', padding: '8px 16px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
          Sign In
        </Link>
        <Link href="/auth/register" style={{
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          color: '#fff', fontSize: '14px', fontWeight: 600,
          textDecoration: 'none', padding: '9px 18px', borderRadius: '10px',
          boxShadow: '0 4px 15px rgba(99,102,241,0.35)', whiteSpace: 'nowrap',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(99,102,241,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.35)'; }}>
          Start Free Trial
        </Link>
      </div>
    </nav>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: '#0d0d14', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '680px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '12px 16px', background: '#13131a', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '7px' }}>
        {['#ff5f57','#ffbd2e','#28ca41'].map((c, i) => (
          <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, marginLeft: '8px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)' }}>stockwise.app/dashboard</span>
        </div>
      </div>

      <div style={{ padding: '18px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
          {[
            { label: 'Revenue',    value: 'RM 12,840', change: '+18.2%', c: '#22c55e' },
            { label: 'Items',      value: '247',        change: '+3 today', c: '#6366f1' },
            { label: 'Net Profit', value: 'RM 4,210',  change: '+12.4%', c: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1a24', borderRadius: '10px', padding: '11px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.35)', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: s.c, fontWeight: 600 }}>{s.change}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div style={{ background: '#1a1a24', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>Revenue & Stock Activity</span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['Today','7D','30D'].map((p,i) => (
                <span key={p} style={{ fontSize: '9px', padding: '3px 8px', borderRadius: '5px',
                  background: i===1 ? 'rgba(99,102,241,0.25)' : 'transparent',
                  color: i===1 ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                  border: i===1 ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                }}>{p}</span>
              ))}
            </div>
          </div>
          <svg width="100%" height="65" viewBox="0 0 400 65" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22"/>
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,52 C40,47 80,18 120,22 C160,27 200,12 240,15 C280,18 320,7 360,5 L400,3 L400,65 L0,65 Z" fill="url(#cg1)"/>
            <path d="M0,52 C40,47 80,18 120,22 C160,27 200,12 240,15 C280,18 320,7 360,5 L400,3" fill="none" stroke="#6366f1" strokeWidth="1.5"/>
            <path d="M0,62 C40,55 80,42 120,45 C160,48 200,33 240,37 C280,41 320,27 360,25 L400,22 L400,65 L0,65 Z" fill="url(#cg2)"/>
            <path d="M0,62 C40,55 80,42 120,45 C160,48 200,33 240,37 C280,41 320,27 360,25 L400,22" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Table */}
        <div style={{ background: '#1a1a24', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>Inventory</span>
            <span style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '5px', background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>247 items</span>
          </div>
          {[
            { name: 'Laptop Stand Pro',    qty: 24, status: 'in',  rev: 'RM 2,400' },
            { name: 'USB-C Hub 7-in-1',   qty: 8,  status: 'low', rev: 'RM 960'   },
            { name: 'Wireless Mouse',      qty: 51, status: 'in',  rev: 'RM 4,590' },
            { name: 'Mechanical Keyboard', qty: 3,  status: 'low', rev: 'RM 1,200' },
          ].map(item => (
            <div key={item.name} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flex: 1, minWidth: 0 }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>📦</div>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{item.qty}</span>
                <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '5px', fontWeight: 600,
                  background: item.status==='in' ? 'rgba(34,197,94,0.14)' : 'rgba(245,158,11,0.14)',
                  color: item.status==='in' ? '#4ade80' : '#fbbf24',
                }}>{item.status==='in' ? 'In Stock' : 'Low'}</span>
                <span style={{ fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>{item.rev}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── Extracted sub-components (hooks must be at top level of component) ───────
function FeatureCard({ feature: f, index: i }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{
      background: '#0d0d14', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px', padding: '26px 22px',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(22px)',
      transition: `all 0.6s ease ${i * 75}ms`, cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}44`; e.currentTarget.style.background = `${f.color}08`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = '#0d0d14'; }}>
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', background: `${f.color}18`, border: `1px solid ${f.color}2a` }}>{f.icon}</div>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.2px' }}>{f.title}</h3>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.48)', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
    </div>
  );
}

function PainRow({ item: p, index: i }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{
      display: 'grid', gridTemplateColumns: '1fr 36px 1fr', alignItems: 'center', gap: '16px',
      padding: '18px 20px', borderRadius: '14px',
      background: '#0d0d14', border: '1px solid rgba(255,255,255,0.06)',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateX(-18px)',
      transition: `all 0.6s ease ${i * 90}ms`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0, filter: 'grayscale(100%) opacity(55%)' }}>😤</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.4 }}>{p.pain}</span>
      </div>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#a78bfa', justifySelf: 'center' }}>→</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>✅</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, lineHeight: 1.4 }}>{p.fix}</span>
      </div>
    </div>
  );
}

function PricingCard({ plan: p, index: i }) {
  const [ref, visible] = useFadeIn();
  return (
    <div ref={ref} style={{
      flex: '1 1 260px', minWidth: '240px',
      background: p.popular ? 'linear-gradient(145deg,#13131a,#1a1a2e)' : '#0d0d14',
      border: p.popular ? `2px solid ${p.color}55` : '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '30px 26px', position: 'relative',
      boxShadow: p.popular ? `0 0 40px ${p.color}18` : 'none',
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(22px)',
      transition: `all 0.6s ease ${i * 90}ms`,
    }}>
      {p.popular && (
        <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${p.color},${p.color}bb)`, color: '#fff', fontSize: '10px', fontWeight: 700, padding: '4px 14px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Most Popular
        </div>
      )}
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{p.name}</h3>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '20px' }}>
        <span style={{ fontSize: '30px', fontWeight: 800, color: '#fff', letterSpacing: '-0.8px' }}>{p.price}</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>/month</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {p.features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
            <span style={{ color: p.color, fontSize: '13px', fontWeight: 700, flexShrink: 0, marginTop: '1px' }}>✓</span>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth/register" style={{
        display: 'block', textAlign: 'center', textDecoration: 'none',
        padding: '12px', borderRadius: '11px', fontWeight: 600, fontSize: '14px',
        background: p.popular ? `linear-gradient(135deg,${p.color},${p.color}cc)` : 'rgba(255,255,255,0.07)',
        color: p.popular ? '#fff' : 'rgba(255,255,255,0.75)',
        border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)',
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
        Start Free Trial
      </Link>
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [user, loading, router]);

  const [heroRef,  heroVisible]  = useFadeIn({ threshold: 0 });
  const [featRef,  featVisible]  = useFadeIn();
  const [painRef,  painVisible]  = useFadeIn();
  const [priceRef, priceVisible] = useFadeIn();
  const [ctaRef,   ctaVisible]   = useFadeIn();

  if (loading || user) return null; // avoid flash before redirect

  return (
    <>
      <Head>
        <title>StockWise — Inventory Management for Modern Businesses</title>
        <meta name="description" content="Track stock, analyse sales, and grow your business — all in one clean dashboard. Start your 30-day free trial, no credit card needed." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{
        background: '#05050f', minHeight: '100vh', overflowX: 'hidden',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", color: '#fff',
      }}>
        <NavBar />

        {/* ════════ HERO ════════ */}
        <section style={{ position: 'relative', paddingTop: '140px', paddingBottom: '80px', overflow: 'hidden' }}>
          {/* Atmosphere glows */}
          <div style={{ position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)', width: '900px', height: '600px', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: '-150px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '80px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 60%)', pointerEvents: 'none' }} />
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.022, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
            {/* Badge */}
            <div ref={heroRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(18px)', transition: 'all 0.7s ease' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '7px 16px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.22)', fontSize: '13px', color: '#a78bfa', fontWeight: 500 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e', display: 'inline-block', animation: 'lp-pulse 2s infinite' }} />
                Built for modern inventory teams · 30-day free trial
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 24px', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(28px)', transition: 'all 0.7s ease 0.1s' }}>
              <h1 style={{ fontSize: 'clamp(38px, 6vw, 68px)', fontWeight: 800, lineHeight: 1.07, letterSpacing: '-2px', margin: '0 0 20px', color: '#fff' }}>
                Stop guessing.{' '}
                <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Start knowing.
                </span>
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2.5vw, 19px)', color: 'rgba(255,255,255,0.52)', lineHeight: 1.68, margin: '0 auto', maxWidth: '560px', fontWeight: 400 }}>
                StockWise gives you real-time inventory tracking, sales analytics, and low-stock alerts — so you always know exactly what&apos;s happening in your business.
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '52px', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(18px)', transition: 'all 0.7s ease 0.2s' }}>
              <Link href="/auth/register" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', padding: '14px 28px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 34px rgba(99,102,241,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.4)'; }}>
                Get Started — Free <span style={{ fontSize: '16px' }}>→</span>
              </Link>
              <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '15px', fontWeight: 600, textDecoration: 'none', padding: '14px 28px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.11)', background: 'rgba(255,255,255,0.04)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}>
                Sign In
              </Link>
            </div>

            {/* Trust line */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', flexWrap: 'wrap', marginBottom: '68px', opacity: heroVisible ? 1 : 0, transition: 'opacity 0.7s ease 0.3s' }}>
              {['No credit card required', '30-day Deluxe trial', 'Cancel anytime'].map(t => (
                <span key={t} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span> {t}
                </span>
              ))}
            </div>

            {/* Dashboard preview */}
            <div style={{ display: 'flex', justifyContent: 'center', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'none' : 'translateY(36px)', transition: 'all 1s ease 0.4s' }}>
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ════════ STATS STRIP ════════ */}
        <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '28px 24px', background: 'rgba(255,255,255,0.018)' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', gap: '40px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
            {[
              { val: '30 days',  label: 'Full-feature free trial' },
              { val: 'RM 0',     label: 'No credit card needed' },
              { val: '< 5 min',  label: 'Setup to first sale' },
              { val: '99.9%',    label: 'Uptime guaranteed' },
            ].map(s => (
              <div key={s.val} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{s.val}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)', marginTop: '3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════ FEATURES ════════ */}
        <section id="features" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div ref={featRef} style={{ textAlign: 'center', maxWidth: '520px', margin: '0 auto 56px', opacity: featVisible ? 1 : 0, transform: featVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '100px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Features</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px', color: '#fff' }}>
                Everything you need to run a tight ship
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>
                Not a Swiss Army knife of features. Just the tools that actually matter for inventory.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '14px' }}>
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PAIN → SOLUTION ════════ */}
        <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.014)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: '820px', margin: '0 auto' }}>
            <div ref={painRef} style={{ textAlign: 'center', marginBottom: '44px', opacity: painVisible ? 1 : 0, transform: painVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.8px', margin: '0 0 10px', color: '#fff' }}>Sound familiar?</h2>
              <p style={{ color: 'rgba(255,255,255,0.42)', fontSize: '16px', margin: 0 }}>StockWise was built to solve these exact problems.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PAIN_SOLUTIONS.map((p, i) => (
                <PainRow key={p.pain} item={p} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ════════ PRICING ════════ */}
        <section id="pricing" style={{ padding: '100px 24px' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto' }}>
            <div ref={priceRef} style={{ textAlign: 'center', marginBottom: '52px', opacity: priceVisible ? 1 : 0, transform: priceVisible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease' }}>
              <div style={{ display: 'inline-block', padding: '5px 14px', borderRadius: '100px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '11px', color: '#4ade80', fontWeight: 600, marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pricing</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px', color: '#fff' }}>
                Start free. Upgrade when you&apos;re ready.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '16px', margin: 0 }}>
                Every plan starts with a full 30-day Deluxe trial. No credit card.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'stretch' }}>
              {PLANS.map((p, i) => (
                <PricingCard key={p.name} plan={p} index={i} />
              ))}
            </div>
            <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>
              All plans include the 30-day Deluxe trial · Cancel anytime · Prices in MYR
            </p>
          </div>
        </section>

        {/* ════════ FINAL CTA ════════ */}
        <section style={{ padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '400px', background: 'radial-gradient(ellipse, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div ref={ctaRef} style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center', position: 'relative', opacity: ctaVisible ? 1 : 0, transform: ctaVisible ? 'none' : 'translateY(22px)', transition: 'all 0.7s ease' }}>
            <div style={{ fontSize: '52px', marginBottom: '22px' }}>📦</div>
            <h2 style={{ fontSize: 'clamp(30px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 18px', color: '#fff', lineHeight: 1.08 }}>
              Your inventory,{' '}
              <span style={{ background: 'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                supercharged.
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.48)', fontSize: '17px', lineHeight: 1.65, margin: '0 0 36px' }}>
              Full Deluxe access for 30 days, completely free. No credit card. No catch.
            </p>
            <Link href="/auth/register" style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
              fontSize: '16px', fontWeight: 700, textDecoration: 'none',
              padding: '16px 36px', borderRadius: '14px',
              boxShadow: '0 8px 28px rgba(99,102,241,0.45)',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 38px rgba(99,102,241,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.45)'; }}>
              Start Free Trial <span style={{ fontSize: '18px' }}>→</span>
            </Link>
            <p style={{ marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.28)' }}>
              No credit card · Takes 2 minutes · Cancel anytime
            </p>
          </div>
        </section>

        {/* ════════ FOOTER ════════ */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 24px', background: '#03030a' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: '#fff' }}>S</div>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>StockWise</span>
              <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '13px', marginLeft: '6px' }}>© 2025</span>
            </div>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[['Sign In', '/auth/login'], ['Register', '/auth/register'], ['Terms', '/terms'], ['Privacy', '/privacy']].map(([label, href]) => (
                <Link key={label} href={href} style={{ color: 'rgba(255,255,255,0.32)', fontSize: '13px', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.32)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>

        <style>{`
          @keyframes lp-pulse {
            0%,100% { opacity:1; transform:scale(1); }
            50%      { opacity:0.55; transform:scale(0.8); }
          }
        `}</style>
      </div>
    </>
  );
}
