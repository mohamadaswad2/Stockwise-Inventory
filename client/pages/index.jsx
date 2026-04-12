/**
 * StockWise Landing Page
 * — Always visible (no auth block)
 * — Authenticated users see a "Go to Dashboard" button in nav
 * — BM/EN auto-detect via navigator.language
 */
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// ─── Language detection — navigator.language, no API ─────────────────────────
function detectLang() {
  if (typeof navigator === 'undefined') return 'en';
  const l = (navigator.language || 'en').toLowerCase();
  return (l.startsWith('ms') || l.startsWith('id')) ? 'ms' : 'en';
}

const T = {
  en: {
    badge:       'Built for modern inventory teams · 30-day free trial',
    headline1:   'Stop guessing.',
    headline2:   'Start knowing.',
    sub:         'StockWise gives you real-time inventory tracking, sales analytics, and low-stock alerts — so you always know exactly what\'s happening in your business.',
    cta1:        'Get Started — Free',
    cta2:        'Sign In',
    trust:       ['No credit card required', '30-day Deluxe trial', 'Cancel anytime'],
    stats: [
      { val: '30 days',  label: 'Full-feature free trial' },
      { val: 'RM 0',     label: 'No credit card needed'   },
      { val: '< 5 min',  label: 'Setup to first sale'     },
      { val: '99.9%',    label: 'Uptime guaranteed'       },
    ],
    featTitle:   'Everything you need to run a tight ship',
    featSub:     'Not a Swiss Army knife. Just the tools that actually matter for inventory.',
    painTitle:   'Sound familiar?',
    painSub:     'StockWise was built to solve these exact problems.',
    priceTitle:  'Start free. Upgrade when you\'re ready.',
    priceSub:    'Every plan starts with a full 30-day Deluxe trial. No credit card.',
    priceNote:   'All plans include 30-day Deluxe trial · Cancel anytime · Prices in MYR',
    ctaTitle:    'Your inventory, supercharged.',
    ctaSub:      'Full Deluxe access for 30 days, completely free. No credit card. No catch.',
    startTrial:  'Start Free Trial',
    ctaNote:     'No credit card · Takes 2 minutes · Cancel anytime',
    tSection:    'What our users say',
    features: [
      { icon: '📦', title: 'Real-Time Stock Tracking',  desc: 'Know your stock levels the moment they change. No more manual counting or spreadsheet guesswork.' },
      { icon: '📊', title: 'Sales & Profit Analytics',  desc: 'See exactly what\'s making you money. Revenue, cost, and margin — all in one clean dashboard.' },
      { icon: '🔔', title: 'Low Stock Alerts',          desc: 'Get email alerts before you run out. Never lose a sale because of an empty shelf again.' },
      { icon: '⚡', title: 'Quick Sell in 2 Taps',      desc: 'Record a sale in seconds from any device. No complicated forms, no training needed.' },
      { icon: '📁', title: 'CSV Export',                desc: 'Pull your inventory data anytime. Share with your accountant or import to any tool.' },
      { icon: '🌙', title: 'Works Day & Night',         desc: 'Light and dark mode. Comfortable on the eyes at 2AM stock-takes.' },
    ],
    pains: [
      { pain: 'Spreadsheets that break when 2 people edit',     fix: 'One source of truth, always up to date' },
      { pain: 'Finding out you\'re out of stock way too late',  fix: 'Automatic alerts before you hit zero' },
      { pain: 'No idea which products are actually profitable', fix: 'See margin on every single item instantly' },
      { pain: 'Hours wasted on manual stock counts',            fix: 'Real-time tracking, zero manual work' },
    ],
    plans: [
      { name: 'Starter', price: 'RM 19', color: '#22c55e', features: ['500 inventory items', 'CSV export (3×/month)', 'Low stock email alerts', 'Dashboard analytics'] },
      { name: 'Premium', price: 'RM 39', color: '#8b5cf6', popular: true, features: ['Unlimited inventory items', 'Advanced sales analytics', 'Profit & cost tracking', 'Priority support'] },
      { name: 'Deluxe',  price: 'RM 69', color: '#6366f1', features: ['Everything in Premium', 'Full analytics (3M history)', 'Unlimited CSV exports', 'Early access features'] },
    ],
    reviews: [
      { name: 'Amir Hassan', role: 'Kedai Elektronik, KL', text: 'Sebelum ni guna Excel, selalu tersalah kira. Sekarang semua real-time. Rasa lega.' },
      { name: 'Sarah Lim',   role: 'Online Boutique Owner', text: 'The low stock alerts alone saved me from losing 3 big orders. Worth every ringgit.' },
      { name: 'Raj Kumar',   role: 'Hardware Supplier, PJ', text: 'Setup took 10 minutes. My team picked it up without any training. Simple and powerful.' },
    ],
  },
  ms: {
    badge:       'Dibina untuk perniagaan moden · Cuba percuma 30 hari',
    headline1:   'Henti tekaan.',
    headline2:   'Mula tahu.',
    sub:         'StockWise beri anda tracking stok masa nyata, analitik jualan, dan amaran stok rendah — supaya anda sentiasa tahu apa yang berlaku dalam perniagaan anda.',
    cta1:        'Mulakan Percuma',
    cta2:        'Log Masuk',
    trust:       ['Tiada kad kredit diperlukan', 'Trial Deluxe 30 hari', 'Batal bila-bila masa'],
    stats: [
      { val: '30 hari',  label: 'Trial semua ciri percuma' },
      { val: 'RM 0',     label: 'Tiada kad kredit'         },
      { val: '< 5 min',  label: 'Setup hingga rekod jualan' },
      { val: '99.9%',    label: 'Masa beroperasi'          },
    ],
    featTitle:   'Semua yang anda perlukan untuk kawal stok',
    featSub:     'Bukan beratus ciri yang tak guna. Hanya alat yang benar-benar penting.',
    painTitle:   'Terasa familiar?',
    painSub:     'StockWise dibina untuk selesaikan masalah-masalah ini.',
    priceTitle:  'Mulakan percuma. Naik taraf bila bersedia.',
    priceSub:    'Setiap pelan bermula dengan trial Deluxe 30 hari. Tanpa kad kredit.',
    priceNote:   'Semua pelan termasuk trial 30 hari · Batal bila-bila masa · Harga dalam MYR',
    ctaTitle:    'Inventori anda, lebih power.',
    ctaSub:      'Akses penuh Deluxe selama 30 hari, sepenuhnya percuma. Tiada syarat.',
    startTrial:  'Mulakan Trial Percuma',
    ctaNote:     'Tiada kad kredit · 2 minit setup · Batal bila-bila masa',
    tSection:    'Apa kata pengguna kami',
    features: [
      { icon: '📦', title: 'Tracking Stok Masa Nyata',   desc: 'Tahu paras stok anda sebaik ia berubah. Tiada lagi kiraan manual atau kesilapan spreadsheet.' },
      { icon: '📊', title: 'Analitik Jualan & Untung',   desc: 'Lihat dengan tepat apa yang buat anda untung. Hasil, kos, dan margin dalam satu papan pemuka.' },
      { icon: '🔔', title: 'Amaran Stok Rendah',         desc: 'Terima amaran emel sebelum kehabisan. Jangan lagi hilang jualan sebab rak kosong.' },
      { icon: '⚡', title: 'Rekod Jualan dalam 2 Ketuk', desc: 'Rekod jualan dalam beberapa saat dari mana-mana peranti. Tiada borang rumit, tiada latihan.' },
      { icon: '📁', title: 'Eksport CSV',                desc: 'Tarik data inventori bila-bila masa. Kongsi dengan akauntan atau import ke mana-mana alat.' },
      { icon: '🌙', title: 'Siang & Malam',              desc: 'Mod cerah dan gelap. Selesa di mata waktu kira stok pukul 2 pagi.' },
    ],
    pains: [
      { pain: 'Spreadsheet rosak bila 2 orang edit serentak',     fix: 'Satu sumber data, sentiasa dikemas kini' },
      { pain: 'Tahu kehabisan stok hanya bila pelanggan complain', fix: 'Amaran automatik sebelum sampai kosong' },
      { pain: 'Tak tahu produk mana yang benar-benar untung',      fix: 'Lihat margin setiap item dengan serta-merta' },
      { pain: 'Jam-jam dihabiskan kira stok secara manual',        fix: 'Tracking masa nyata, tiada kerja manual' },
    ],
    plans: [
      { name: 'Starter', price: 'RM 19', color: '#22c55e', features: ['500 item inventori', 'Eksport CSV (3×/bulan)', 'Amaran emel stok rendah', 'Analitik asas'] },
      { name: 'Premium', price: 'RM 39', color: '#8b5cf6', popular: true, features: ['Item inventori tanpa had', 'Analitik jualan lanjutan', 'Tracking untung & kos', 'Sokongan keutamaan'] },
      { name: 'Deluxe',  price: 'RM 69', color: '#6366f1', features: ['Semua dalam Premium', 'Analitik penuh (sejarah 3B)', 'Eksport CSV tanpa had', 'Akses awal ciri baru'] },
    ],
    reviews: [
      { name: 'Amir Hassan', role: 'Kedai Elektronik, KL',    text: 'Sebelum ni guna Excel, selalu tersalah kira. Sekarang semua real-time. Rasa lega sangat.' },
      { name: 'Sarah Lim',   role: 'Pemilik Butik Online',    text: 'Amaran stok rendah je dah selamatkan aku dari hilang 3 pesanan besar. Berbaloi.' },
      { name: 'Raj Kumar',   role: 'Pembekal Perkakasan, PJ', text: 'Setup dalam 10 minit. Team aku faham tanpa latihan langsung. Mudah tapi power.' },
    ],
  },
};

// ─── SVG Logo Component ───────────────────────────────────────────────────────
function SWLogo({ size = 32, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <defs>
        <linearGradient id="sw-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1"/>
          <stop offset="100%" stopColor="#a855f7"/>
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="32" height="32" rx="9" fill="url(#sw-grad)"/>
      {/* Abstract S-shape / stock chart bars */}
      <rect x="6"  y="18" width="5" height="8"  rx="1.5" fill="white" opacity="0.9"/>
      <rect x="13.5" y="12" width="5" height="14" rx="1.5" fill="white"/>
      <rect x="21" y="6"  width="5" height="20" rx="1.5" fill="white" opacity="0.7"/>
      {/* Trend line */}
      <path d="M8.5 17 L16 11 L23.5 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

// ─── Fade-in hook — fires on mount OR on intersection ────────────────────────
// FIX: rootMargin '200px' means elements 200px below viewport still fire early
// FIX: threshold 0 fires as soon as 1px is visible
function useFadeIn(delay = 0) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight + 100) {
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    }
    // Otherwise observe
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return [ref, visible];
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({ t, user, lang, setLang }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 clamp(16px, 4vw, 32px)', height: '64px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(5,5,15,0.9)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
    }}>
      {/* Logo — always links to / */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
        <SWLogo size={32} />
        <span style={{ fontWeight: 700, fontSize: '17px', color: '#fff', letterSpacing: '-0.3px' }}>
          StockWise
        </span>
      </Link>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Language Toggle */}
        <button
          onClick={() => setLang(lang === 'en' ? 'ms' : 'en')}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '7px 12px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.12)'; e.currentTarget.style.color='#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='rgba(255,255,255,0.7)'; }}
        >
          <span>{lang === 'en' ? '🇬🇧' : '🇲🇾'}</span>
          <span>{lang.toUpperCase()}</span>
        </button>

        {user ? (
          <Link href="/dashboard" style={{
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
            fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            padding: '9px 18px', borderRadius: '10px',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}>
            Dashboard →
          </Link>
        ) : (
          <>
            <Link href="/auth/login" style={{ color: 'rgba(255,255,255,0.62)', fontSize: '14px', fontWeight: 500, textDecoration: 'none', padding: '8px 14px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color='#fff'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.62)'}
            >
              {t.cta2}
            </Link>
            <Link href="/auth/register" style={{
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
              padding: '9px 18px', borderRadius: '10px', whiteSpace: 'nowrap',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(99,102,241,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(99,102,241,0.35)'; }}
            >
              {t.startTrial}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

// ─── Dashboard Mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: '#0d0d14', borderRadius: '16px', overflow: 'hidden',
      width: '100%', maxWidth: '680px',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 40px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px rgba(99,102,241,0.08)',
    }}>
      {/* Window chrome */}
      <div style={{ padding: '11px 16px', background: '#13131a', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '7px' }}>
        {['#ff5f57','#ffbd2e','#28ca41'].map((c,i) => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:c }} />)}
        <div style={{ flex:1, marginLeft:'8px', height:'22px', borderRadius:'6px', background:'rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.28)' }}>stockwise.app/dashboard</span>
        </div>
      </div>
      <div style={{ padding: '18px' }}>
        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { label:'Revenue',    value:'RM 12,840', change:'+18.2%', c:'#22c55e' },
            { label:'Items',      value:'247',        change:'+3 today', c:'#6366f1' },
            { label:'Net Profit', value:'RM 4,210',  change:'+12.4%', c:'#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ background:'#1a1a24', borderRadius:'10px', padding:'11px', border:'1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize:'9px', color:'rgba(255,255,255,0.35)', marginBottom:'5px' }}>{s.label}</div>
              <div style={{ fontSize:'14px', fontWeight:700, color:'#fff', marginBottom:'3px' }}>{s.value}</div>
              <div style={{ fontSize:'10px', color:s.c, fontWeight:600 }}>{s.change}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ background:'#1a1a24', borderRadius:'10px', padding:'14px', border:'1px solid rgba(255,255,255,0.05)', marginBottom:'12px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
            <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.65)' }}>Revenue & Stock Activity</span>
            <div style={{ display:'flex', gap:'5px' }}>
              {['Today','7D','30D'].map((p,i) => (
                <span key={p} style={{ fontSize:'9px', padding:'3px 8px', borderRadius:'5px',
                  background: i===1?'rgba(99,102,241,0.25)':'transparent',
                  color: i===1?'#a78bfa':'rgba(255,255,255,0.25)',
                  border: i===1?'1px solid rgba(99,102,241,0.4)':'1px solid transparent',
                }}>{p}</span>
              ))}
            </div>
          </div>
          <svg width="100%" height="65" viewBox="0 0 400 65" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient>
              <linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.22"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M0,52 C40,47 80,18 120,22 C160,27 200,12 240,15 C280,18 320,7 360,5 L400,3 L400,65 L0,65 Z" fill="url(#cg1)"/>
            <path d="M0,52 C40,47 80,18 120,22 C160,27 200,12 240,15 C280,18 320,7 360,5 L400,3" fill="none" stroke="#6366f1" strokeWidth="1.5"/>
            <path d="M0,62 C40,55 80,42 120,45 C160,48 200,33 240,37 C280,41 320,27 360,25 L400,22 L400,65 L0,65 Z" fill="url(#cg2)"/>
            <path d="M0,62 C40,55 80,42 120,45 C160,48 200,33 240,37 C280,41 320,27 360,25 L400,22" fill="none" stroke="#22c55e" strokeWidth="1.5"/>
          </svg>
        </div>
        {/* Table */}
        <div style={{ background:'#1a1a24', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.05)', overflow:'hidden' }}>
          <div style={{ padding:'9px 14px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.65)' }}>Inventory</span>
            <span style={{ fontSize:'9px', padding:'2px 8px', borderRadius:'5px', background:'rgba(99,102,241,0.2)', color:'#a78bfa' }}>247 items</span>
          </div>
          {[
            { name:'Laptop Stand Pro',    qty:24, status:'in',  rev:'RM 2,400' },
            { name:'USB-C Hub 7-in-1',   qty:8,  status:'low', rev:'RM 960'   },
            { name:'Wireless Mouse',      qty:51, status:'in',  rev:'RM 4,590' },
            { name:'Mechanical Keyboard', qty:3,  status:'low', rev:'RM 1,200' },
          ].map(item => (
            <div key={item.name} style={{ padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'9px', flex:1, minWidth:0 }}>
                <div style={{ width:'24px', height:'24px', borderRadius:'7px', background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', flexShrink:0 }}>📦</div>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.75)', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.32)' }}>{item.qty}</span>
                <span style={{ fontSize:'9px', padding:'2px 7px', borderRadius:'5px', fontWeight:600,
                  background: item.status==='in'?'rgba(34,197,94,0.14)':'rgba(245,158,11,0.14)',
                  color: item.status==='in'?'#4ade80':'#fbbf24',
                }}>{item.status==='in'?'In Stock':'Low'}</span>
                <span style={{ fontSize:'10px', color:'#4ade80', fontWeight:600 }}>{item.rev}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
const FEAT_COLORS = ['#6366f1','#8b5cf6','#a855f7','#7c3aed','#6d28d9','#5b21b6'];

function FeatureCard({ feature: f, index: i, color }) {
  const [ref, visible] = useFadeIn(i * 70);
  return (
    <div ref={ref} style={{
      background:'#0d0d14', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'24px 20px',
      opacity: visible?1:0, transform: visible?'none':'translateY(20px)',
      transition:'opacity 0.55s ease, transform 0.55s ease, border-color 0.2s, background 0.2s',
      cursor:'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor=`${color}44`; e.currentTarget.style.background=`${color}08`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.background='#0d0d14'; }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'12px', fontSize:'20px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'14px', background:`${color}18`, border:`1px solid ${color}28` }}>{f.icon}</div>
      <h3 style={{ fontSize:'15px', fontWeight:700, color:'#fff', margin:'0 0 8px', letterSpacing:'-0.2px' }}>{f.title}</h3>
      <p style={{ fontSize:'13px', color:'rgba(255,255,255,0.48)', margin:0, lineHeight:1.6 }}>{f.desc}</p>
    </div>
  );
}

// ─── Pain Row ─────────────────────────────────────────────────────────────────
function PainRow({ item: p, index: i }) {
  const [ref, visible] = useFadeIn(i * 90);
  return (
    <div ref={ref} style={{
      display:'grid', gridTemplateColumns:'1fr 40px 1fr', alignItems:'center', gap:'14px',
      padding:'16px 20px', borderRadius:'14px', background:'#0d0d14', border:'1px solid rgba(255,255,255,0.06)',
      opacity: visible?1:0, transform: visible?'none':'translateX(-16px)',
      transition:'opacity 0.55s ease, transform 0.55s ease',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'15px', flexShrink:0, filter:'grayscale(100%) opacity(50%)' }}>😤</span>
        <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', lineHeight:1.4 }}>{p.pain}</span>
      </div>
      <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(99,102,241,0.16)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', color:'#a78bfa', justifySelf:'center' }}>→</div>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontSize:'15px', flexShrink:0 }}>✅</span>
        <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.82)', fontWeight:500, lineHeight:1.4 }}>{p.fix}</span>
      </div>
    </div>
  );
}

// ─── Pricing Card ─────────────────────────────────────────────────────────────
function PricingCard({ plan: p, index: i, startTrial }) {
  const [ref, visible] = useFadeIn(i * 90);
  return (
    <div ref={ref} style={{
      flex:'1 1 250px', minWidth:'220px',
      background: p.popular?'linear-gradient(145deg,#13131a,#1a1a2e)':'#0d0d14',
      border: p.popular?`2px solid ${p.color}55`:'1px solid rgba(255,255,255,0.07)',
      borderRadius:'20px', padding:'28px 24px', position:'relative',
      boxShadow: p.popular?`0 0 40px ${p.color}18`:'none',
      opacity: visible?1:0, transform: visible?'none':'translateY(20px)',
      transition:'opacity 0.55s ease, transform 0.55s ease',
    }}>
      {p.popular && (
        <div style={{ position:'absolute', top:'-12px', left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${p.color},${p.color}bb)`, color:'#fff', fontSize:'10px', fontWeight:700, padding:'4px 14px', borderRadius:'20px', whiteSpace:'nowrap', letterSpacing:'0.06em', textTransform:'uppercase' }}>
          Most Popular
        </div>
      )}
      <h3 style={{ fontSize:'16px', fontWeight:700, color:'#fff', margin:'0 0 8px' }}>{p.name}</h3>
      <div style={{ display:'flex', alignItems:'baseline', gap:'4px', marginBottom:'20px' }}>
        <span style={{ fontSize:'28px', fontWeight:800, color:'#fff', letterSpacing:'-0.8px' }}>{p.price}</span>
        <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.35)' }}>/month</span>
      </div>
      <ul style={{ listStyle:'none', padding:0, margin:'0 0 22px', display:'flex', flexDirection:'column', gap:'9px' }}>
        {p.features.map(f => (
          <li key={f} style={{ display:'flex', alignItems:'flex-start', gap:'9px' }}>
            <span style={{ color:p.color, fontSize:'13px', fontWeight:700, flexShrink:0, marginTop:'1px' }}>✓</span>
            <span style={{ fontSize:'13px', color:'rgba(255,255,255,0.58)' }}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/auth/register" style={{
        display:'block', textAlign:'center', textDecoration:'none', padding:'12px', borderRadius:'11px', fontWeight:600, fontSize:'14px',
        background: p.popular?`linear-gradient(135deg,${p.color},${p.color}cc)`:'rgba(255,255,255,0.07)',
        color: p.popular?'#fff':'rgba(255,255,255,0.72)',
        border: p.popular?'none':'1px solid rgba(255,255,255,0.1)',
        transition:'opacity 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity='1'}>
        {startTrial}
      </Link>
    </div>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, index: i }) {
  const [ref, visible] = useFadeIn(i * 90);
  return (
    <div ref={ref} style={{
      flex:'1 1 260px', minWidth:'220px',
      background:'#0d0d14', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'24px',
      opacity: visible?1:0, transform: visible?'none':'translateY(16px)',
      transition:'opacity 0.55s ease, transform 0.55s ease',
    }}>
      {/* Stars */}
      <div style={{ display:'flex', gap:'3px', marginBottom:'14px' }}>
        {[...Array(5)].map((_,j) => (
          <svg key={j} width="14" height="14" viewBox="0 0 14 14" fill="#fbbf24">
            <path d="M7 1l1.5 4h4l-3.3 2.4 1.3 4L7 9 3.5 11.4l1.3-4L1.5 5H5.5z"/>
          </svg>
        ))}
      </div>
      <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.7)', lineHeight:1.65, margin:'0 0 16px', fontStyle:'italic' }}>
        &ldquo;{review.text}&rdquo;
      </p>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'#fff', flexShrink:0 }}>
          {review.name[0]}
        </div>
        <div>
          <p style={{ fontSize:'13px', fontWeight:700, color:'#fff', margin:0 }}>{review.name}</p>
          <p style={{ fontSize:'11px', color:'rgba(255,255,255,0.38)', margin:0 }}>{review.role}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const [lang, setLang] = useState('en');

  // Detect language on client — no SSR needed
  useEffect(() => { setLang(detectLang()); }, []);

  const t = T[lang];

  // Refs for sections
  const [heroRef,  heroVisible]  = useFadeIn(0);
  const [featRef,  featVisible]  = useFadeIn(0);
  const [painRef,  painVisible]  = useFadeIn(0);
  const [priceRef, priceVisible] = useFadeIn(0);
  const [revRef,   revVisible]   = useFadeIn(0);
  const [ctaRef,   ctaVisible]   = useFadeIn(0);

  return (
    <>
      <Head>
        <title>StockWise — Inventory Management for Modern Businesses</title>
        <meta name="description" content="Track stock, analyse sales, and grow your business — all in one clean dashboard. Start your 30-day free trial, no credit card needed." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Favicon — inline SVG as data URI */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='32' y2='32' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0%25' stop-color='%236366f1'/%3E%3Cstop offset='100%25' stop-color='%23a855f7'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='32' height='32' rx='9' fill='url(%23g)'/%3E%3Crect x='6' y='18' width='5' height='8' rx='1.5' fill='white' opacity='.9'/%3E%3Crect x='13.5' y='12' width='5' height='14' rx='1.5' fill='white'/%3E%3Crect x='21' y='6' width='5' height='20' rx='1.5' fill='white' opacity='.7'/%3E%3C/svg%3E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ background:'#05050f', minHeight:'100vh', overflowX:'hidden', fontFamily:"'Plus Jakarta Sans','Inter',sans-serif", color:'#fff' }}>

        <NavBar t={t} user={user} lang={lang} setLang={setLang} />

        {/* ═══ HERO ══════════════════════════════════════════════════════ */}
        <section style={{ position:'relative', paddingTop:'140px', paddingBottom:'80px', overflow:'hidden' }}>
          {/* Atmosphere */}
          <div style={{ position:'absolute', top:'-180px', left:'50%', transform:'translateX(-50%)', width:'900px', height:'600px', borderRadius:'50%', background:'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:0, left:'-150px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 60%)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'80px', right:'-100px', width:'500px', height:'500px', background:'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 60%)', pointerEvents:'none' }}/>
          {/* Grid */}
          <div style={{ position:'absolute', inset:0, opacity:0.02, backgroundImage:'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize:'64px 64px', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'0 clamp(16px,4vw,32px)', position:'relative' }}>
            {/* Badge */}
            <div ref={heroRef} style={{ display:'flex', justifyContent:'center', marginBottom:'28px', opacity:heroVisible?1:0, transform:heroVisible?'none':'translateY(16px)', transition:'opacity 0.6s ease, transform 0.6s ease' }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'7px 16px', borderRadius:'100px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.22)', fontSize:'13px', color:'#a78bfa', fontWeight:500 }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px #22c55e', display:'inline-block', animation:'sw-pulse 2s infinite' }}/>
                {t.badge}
              </div>
            </div>

            {/* Headline */}
            <div style={{ textAlign:'center', maxWidth:'760px', margin:'0 auto 22px', opacity:heroVisible?1:0, transform:heroVisible?'none':'translateY(24px)', transition:'opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s' }}>
              <h1 style={{ fontSize:'clamp(36px,6vw,66px)', fontWeight:800, lineHeight:1.07, letterSpacing:'-2px', margin:'0 0 18px', color:'#fff' }}>
                {t.headline1}{' '}
                <span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa,#c4b5fd)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  {t.headline2}
                </span>
              </h1>
              <p style={{ fontSize:'clamp(15px,2.5vw,18px)', color:'rgba(255,255,255,0.52)', lineHeight:1.7, margin:'0 auto', maxWidth:'540px', fontWeight:400 }}>
                {t.sub}
              </p>
            </div>

            {/* CTAs */}
            <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap', marginBottom:'44px', opacity:heroVisible?1:0, transform:heroVisible?'none':'translateY(16px)', transition:'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s' }}>
              <Link href="/auth/register" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'15px', fontWeight:700, textDecoration:'none', padding:'14px 26px', borderRadius:'12px', boxShadow:'0 8px 24px rgba(99,102,241,0.4)', display:'inline-flex', alignItems:'center', gap:'8px', transition:'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(99,102,241,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(99,102,241,0.4)'; }}>
                {t.cta1} <span style={{ fontSize:'16px' }}>→</span>
              </Link>
              <Link href="/auth/login" style={{ color:'rgba(255,255,255,0.62)', fontSize:'15px', fontWeight:600, textDecoration:'none', padding:'14px 24px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.11)', background:'rgba(255,255,255,0.04)', transition:'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
                {t.cta2}
              </Link>
            </div>

            {/* Trust */}
            <div style={{ display:'flex', justifyContent:'center', gap:'24px', flexWrap:'wrap', marginBottom:'64px', opacity:heroVisible?1:0, transition:'opacity 0.6s ease 0.3s' }}>
              {t.trust.map(tx => (
                <span key={tx} style={{ fontSize:'13px', color:'rgba(255,255,255,0.36)', display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ color:'#22c55e', fontWeight:700 }}>✓</span> {tx}
                </span>
              ))}
            </div>

            {/* Dashboard preview */}
            <div style={{ display:'flex', justifyContent:'center', opacity:heroVisible?1:0, transform:heroVisible?'none':'translateY(32px)', transition:'opacity 0.9s ease 0.4s, transform 0.9s ease 0.4s' }}>
              <DashboardMockup />
            </div>
          </div>
        </section>

        {/* ═══ STATS STRIP ═══════════════════════════════════════════════ */}
        <section style={{ borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'26px clamp(16px,4vw,32px)', background:'rgba(255,255,255,0.017)' }}>
          <div style={{ maxWidth:'860px', margin:'0 auto', display:'flex', gap:'36px', flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
            {t.stats.map(s => (
              <div key={s.val} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'22px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px' }}>{s.val}</div>
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.36)', marginTop:'3px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES ══════════════════════════════════════════════════ */}
        <section id="features" style={{ padding:'96px clamp(16px,4vw,32px)' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div ref={featRef} style={{ textAlign:'center', maxWidth:'520px', margin:'0 auto 52px', opacity:featVisible?1:0, transform:featVisible?'none':'translateY(18px)', transition:'opacity 0.6s, transform 0.6s' }}>
              <div style={{ display:'inline-block', padding:'5px 14px', borderRadius:'100px', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', fontSize:'11px', color:'#a78bfa', fontWeight:600, marginBottom:'16px', letterSpacing:'0.05em', textTransform:'uppercase' }}>Features</div>
              <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-1px', margin:'0 0 14px', color:'#fff' }}>{t.featTitle}</h2>
              <p style={{ color:'rgba(255,255,255,0.46)', fontSize:'15px', lineHeight:1.65, margin:0 }}>{t.featSub}</p>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'13px' }}>
              {t.features.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} color={FEAT_COLORS[i % FEAT_COLORS.length]} />)}
            </div>
          </div>
        </section>

        {/* ═══ PAIN → SOLUTION ═══════════════════════════════════════════ */}
        <section style={{ padding:'80px clamp(16px,4vw,32px)', background:'rgba(255,255,255,0.013)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth:'800px', margin:'0 auto' }}>
            <div ref={painRef} style={{ textAlign:'center', marginBottom:'40px', opacity:painVisible?1:0, transform:painVisible?'none':'translateY(18px)', transition:'opacity 0.6s, transform 0.6s' }}>
              <h2 style={{ fontSize:'clamp(24px,4vw,34px)', fontWeight:800, letterSpacing:'-0.8px', margin:'0 0 10px', color:'#fff' }}>{t.painTitle}</h2>
              <p style={{ color:'rgba(255,255,255,0.42)', fontSize:'15px', margin:0 }}>{t.painSub}</p>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {t.pains.map((p, i) => <PainRow key={p.pain} item={p} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ══════════════════════════════════════════════ */}
        <section style={{ padding:'96px clamp(16px,4vw,32px)' }}>
          <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
            <div ref={revRef} style={{ textAlign:'center', marginBottom:'48px', opacity:revVisible?1:0, transform:revVisible?'none':'translateY(18px)', transition:'opacity 0.6s, transform 0.6s' }}>
              <div style={{ display:'inline-block', padding:'5px 14px', borderRadius:'100px', background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.2)', fontSize:'11px', color:'#fbbf24', fontWeight:600, marginBottom:'16px', letterSpacing:'0.05em', textTransform:'uppercase' }}>Reviews</div>
              <h2 style={{ fontSize:'clamp(26px,4vw,36px)', fontWeight:800, letterSpacing:'-0.8px', margin:'0 0 10px', color:'#fff' }}>{t.tSection}</h2>
            </div>
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap' }}>
              {t.reviews.map((r, i) => <ReviewCard key={r.name} review={r} index={i} />)}
            </div>
          </div>
        </section>

        {/* ═══ PRICING ═══════════════════════════════════════════════════ */}
        <section id="pricing" style={{ padding:'96px clamp(16px,4vw,32px)', background:'rgba(255,255,255,0.013)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth:'960px', margin:'0 auto' }}>
            <div ref={priceRef} style={{ textAlign:'center', marginBottom:'48px', opacity:priceVisible?1:0, transform:priceVisible?'none':'translateY(18px)', transition:'opacity 0.6s, transform 0.6s' }}>
              <div style={{ display:'inline-block', padding:'5px 14px', borderRadius:'100px', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', fontSize:'11px', color:'#4ade80', fontWeight:600, marginBottom:'16px', letterSpacing:'0.05em', textTransform:'uppercase' }}>Pricing</div>
              <h2 style={{ fontSize:'clamp(26px,4vw,38px)', fontWeight:800, letterSpacing:'-1px', margin:'0 0 14px', color:'#fff' }}>{t.priceTitle}</h2>
              <p style={{ color:'rgba(255,255,255,0.46)', fontSize:'15px', margin:0 }}>{t.priceSub}</p>
            </div>
            <div style={{ display:'flex', gap:'14px', flexWrap:'wrap', alignItems:'stretch' }}>
              {t.plans.map((p, i) => <PricingCard key={p.name} plan={p} index={i} startTrial={t.startTrial} />)}
            </div>
            <p style={{ textAlign:'center', marginTop:'24px', fontSize:'12px', color:'rgba(255,255,255,0.26)' }}>{t.priceNote}</p>
          </div>
        </section>

        {/* ═══ FINAL CTA ═════════════════════════════════════════════════ */}
        <section style={{ padding:'100px clamp(16px,4vw,32px)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'400px', background:'radial-gradient(ellipse,rgba(99,102,241,0.14) 0%,transparent 70%)', pointerEvents:'none' }}/>
          <div ref={ctaRef} style={{ maxWidth:'580px', margin:'0 auto', textAlign:'center', position:'relative', opacity:ctaVisible?1:0, transform:ctaVisible?'none':'translateY(20px)', transition:'opacity 0.6s, transform 0.6s' }}>
            <Link href="/" style={{ display:'inline-block', marginBottom:'22px', textDecoration:'none' }}>
              <SWLogo size={52} />
            </Link>
            <h2 style={{ fontSize:'clamp(28px,5vw,46px)', fontWeight:800, letterSpacing:'-1.5px', margin:'0 0 18px', color:'#fff', lineHeight:1.08 }}>
              {t.ctaTitle.split(', ')[0]},{' '}
              <span style={{ background:'linear-gradient(135deg,#818cf8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                {t.ctaTitle.split(', ')[1] || 'supercharged.'}
              </span>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.48)', fontSize:'16px', lineHeight:1.68, margin:'0 0 34px' }}>{t.ctaSub}</p>
            <Link href="/auth/register" style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:'16px', fontWeight:700, textDecoration:'none', padding:'16px 34px', borderRadius:'14px', boxShadow:'0 8px 28px rgba(99,102,241,0.45)', display:'inline-flex', alignItems:'center', gap:'8px', transition:'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 14px 38px rgba(99,102,241,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(99,102,241,0.45)'; }}>
              {t.startTrial} <span style={{ fontSize:'18px' }}>→</span>
            </Link>
            <p style={{ marginTop:'14px', fontSize:'13px', color:'rgba(255,255,255,0.26)' }}>{t.ctaNote}</p>
          </div>
        </section>

        {/* ═══ FOOTER ════════════════════════════════════════════════════ */}
        <footer style={{ borderTop:'1px solid rgba(255,255,255,0.06)', padding:'32px clamp(16px,4vw,32px)', background:'#03030a' }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:'16px' }}>
            <Link href="/" style={{ display:'flex', alignItems:'center', gap:'9px', textDecoration:'none' }}>
              <SWLogo size={26} />
              <span style={{ fontWeight:700, color:'#fff', fontSize:'14px' }}>StockWise</span>
              <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'12px', marginLeft:'4px' }}>© 2025</span>
            </Link>
            <div style={{ display:'flex', gap:'22px', flexWrap:'wrap' }}>
              {[['Sign In','/auth/login'],['Register','/auth/register'],['Terms','/terms'],['Privacy','/privacy']].map(([label,href]) => (
                <Link key={label} href={href} style={{ color:'rgba(255,255,255,0.3)', fontSize:'13px', textDecoration:'none', fontWeight:500, transition:'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.65)'}
                  onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.3)'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </footer>

        <style>{`
          @keyframes sw-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.55;transform:scale(0.8);} }
          *{box-sizing:border-box;}
        `}</style>
      </div>
    </>
  );
}
