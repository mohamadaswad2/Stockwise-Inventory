import { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Megaphone, Sparkles, Wrench, Bug, Zap,
  ThumbsUp, ChevronDown, ChevronUp, ArrowLeft,
  Search, SlidersHorizontal, ArrowUpDown,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';

// ─── Update data — production changelog ──────────────────────────────────────
const UPDATES = [
  {
    id: 'u-009',
    title: 'Refund System — Full Refund Flow',
    category: 'feature',
    date: '2025-04-14',
    summary: 'Process customer refunds directly from the Sales page. Each refund automatically restores inventory stock and appears in your analytics as negative revenue — giving you an accurate net picture.',
    body: `We've built a complete refund workflow so you never have to manually adjust stock after a return again.

**What's new:**
- Refund button on every sale transaction in the Sales page
- Partial refund support — refund any quantity up to the original sale amount
- Inventory auto-restores on refund (no manual adjustment needed)
- Refunds appear in Analytics as negative revenue, keeping your net figures accurate
- Reason field for audit trail

**How it works:**
1. Go to Sales → Recent Transactions
2. Click Refund on any sale row
3. Enter quantity and optional reason
4. Confirm — stock is restored instantly

Refunds are separate transactions, not edits — so your original sale record stays intact for full audit visibility.`,
  },
  {
    id: 'u-008',
    title: 'Analytics Precision Fix — Profit Now Shows Negative Values',
    category: 'fix',
    date: '2025-04-13',
    summary: 'Fixed a bug where profit was incorrectly shown as RM0 when cost exceeded revenue. Profit now correctly shows negative values, and all calculations use 4-decimal precision to prevent rounding errors.',
    body: `A critical fix to financial calculation accuracy that was hiding real data from you.

**What was broken:**
- Profit displayed as RM0 when it should be negative (e.g., cost-only transactions)
- Prices stored at 2 decimal places caused rounding: 0.495 × 20 = 9.80 instead of 9.90
- Quick Sell cost was not being saved (column was missing)

**What's fixed:**
- Profit now correctly shows negative values (e.g., RM-10.80)
- All price/cost columns upgraded to 4 decimal precision (NUMERIC 12,4)
- transactions.cost_price column added — Quick Sell now correctly tracks cost
- No more Math.max(0, profit) clamping in JS or SQL

**Why this matters:**
Your profit figures now match what you'd calculate in Excel. If you sell something below cost, you'll see it clearly instead of a misleading RM0.`,
  },
  {
    id: 'u-007',
    title: 'Revenue Explainer & Transaction Type Legend',
    category: 'feature',
    date: '2025-04-12',
    summary: 'Added a smart Revenue Explainer that appears when your revenue is negative or refund rate is high. Also added a "Understanding Revenue" guide explaining all 6 transaction types.',
    body: `New contextual components to help you understand your numbers without needing documentation.

**Revenue Explainer:**
- Appears automatically when revenue is negative or refund rate exceeds 15%
- Shows gross sales, total refunds, and net result in one glance
- Click to expand for the full breakdown
- Orange alert for high refund rate, red for negative net revenue

**Transaction Type Legend:**
- Click "Understanding Revenue" in the Analytics header
- Explains all 6 types: Sale, Refund, Cancelled, Restock, Adjustment, Usage
- Side-by-side comparison of Cancelled vs Refund (a common source of confusion)
- Explains why net revenue can be negative with a real example`,
  },
  {
    id: 'u-006',
    title: 'Metric Tooltips — Hover for Explanations',
    category: 'feature',
    date: '2025-04-11',
    summary: 'Added "?" tooltip icons to all key metrics on Dashboard, Analytics, and Sales pages. Hover to see a plain-language explanation of what each number means.',
    body: `Every metric now has a hover tooltip explaining what it means — no more guessing.

**Where tooltips appear:**
- Dashboard: Total Items, Total Stock, Low Stock, Inventory Value
- Analytics: Revenue, Profit, Cost, Transactions
- Sales: Total Revenue, Last 30 Days, Transactions, Units Sold

**Language support:**
Tooltips automatically match your language toggle (BM/EN).

**Design:**
Clean arrow-pointed tooltip card that appears above the icon, built with no extra dependencies — pure React state.`,
  },
  {
    id: 'u-005',
    title: 'Inventory Loading — No More Scroll Reset',
    category: 'fix',
    date: '2025-04-10',
    summary: 'Fixed an annoying bug where the inventory table would scroll back to the top after every edit, restock, or quick sell. The table now stays at your position while data refreshes in the background.',
    body: `One of the most reported UX issues — fixed.

**The problem:**
After selling, restocking, or editing an item, the page would fully unmount and remount the table component. This reset your scroll position to the top, which was frustrating when working through a long list.

**The fix:**
- Table now uses a subtle loading overlay instead of full unmount
- Scroll position is preserved during all data refreshes
- Opacity dims to 60% with a blur overlay during refresh — clear visual feedback without layout disruption
- Only shows full spinner on initial load when there are no items yet

**Also added:**
Retry logic for inventory fetches — if the server is cold-starting, the app automatically retries up to 3 times before showing an error.`,
  },
  {
    id: 'u-004',
    title: 'Timezone-Aware Charts',
    category: 'fix',
    date: '2025-04-08',
    summary: 'Fixed chart data showing wrong values for users in non-UTC timezones. "Today" now correctly resets at your local midnight, not UTC midnight.',
    body: `Analytics and dashboard charts now reflect your local timezone correctly.

**The problem:**
For users in Malaysia (UTC+8), "today" in the charts was resetting at 8:00 AM instead of midnight. This meant the previous night's sales were showing in "yesterday" even though you made them before sleeping.

**The fix:**
- Period filters (today, 7D, 30D, 3M) now use your local timezone for cutoff calculation
- Chart grouping and X-axis labels still display in your local time
- Timezone is auto-detected from your browser (Intl API) and sent with each request
- Validated against PostgreSQL's AT TIME ZONE handling

**Result:**
Charts and analytics now reset at exactly 00:00 your local time — consistent with what you'd expect.`,
  },
  {
    id: 'u-003',
    title: 'Price Display Polish — No Trailing Zeros',
    category: 'update',
    date: '2025-04-07',
    summary: 'Currency formatting now strips unnecessary trailing zeros. RM1.00 shows as RM1, RM1.20 shows as RM1.2. Cleaner and less distracting for everyday use.',
    body: `A small but meaningful polish to how prices are displayed throughout the app.

**Before → After:**
- RM1.00 → RM1
- RM1.20 → RM1.2  
- RM1.23 → RM1.23 (no change when both decimals meaningful)
- RM100.00 → RM100

**Where this applies:**
All currency displays using the format() and formatFull() functions — inventory prices, sales totals, analytics metrics, and chart tooltips.

**Why:**
Trailing zeros add visual noise without adding information. Clean numbers are faster to read and feel more professional.`,
  },
  {
    id: 'u-002',
    title: 'Stripe Billing Integration',
    category: 'feature',
    date: '2025-04-05',
    summary: 'Subscription management is now live. Upgrade directly from the Settings → Billing page. Downgrade and cancellation handled through the Stripe Customer Portal.',
    body: `Full subscription lifecycle management is now integrated.

**What's available:**
- Upgrade to Starter (RM19/month), Premium (RM39/month), or Deluxe (RM69/month)
- Click Upgrade → redirected to Stripe Checkout (secure, handles card validation)
- Downgrade → redirected to Stripe Customer Portal (modify or cancel existing sub)
- Plan changes take effect immediately via webhook

**How it works:**
1. Settings → Billing
2. Choose your plan
3. Complete payment on Stripe's hosted checkout
4. Return to app — plan upgraded automatically

**Trial:**
Every new account gets 30 days of full Deluxe access. No credit card required to start.`,
  },
  {
    id: 'u-001',
    title: 'StockWise v1.0 — Launch',
    category: 'announcement',
    date: '2025-04-01',
    summary: 'StockWise is officially live. Real-time inventory tracking, sales analytics, low-stock alerts, and multi-currency support — built for small and growing businesses in Malaysia.',
    body: `StockWise is officially open for business.

**Core features at launch:**
- Real-time inventory tracking with categories and SKU support
- Quick Sell — record a sale in 2 taps
- Restock with cost tracking
- Sales analytics with revenue, profit, and cost breakdown
- Low stock alerts via email (paid plans)
- CSV export for accountants and audits
- Dark and light mode
- MYR/USD currency toggle with live exchange rates
- 30-day full Deluxe trial for every new account

**Built for:**
Small retailers, online sellers, hardware shops, F&B operators — anyone who tracks physical stock and wants clarity on what's selling and what's sitting.

**What's coming:**
Barcode scanner support, invoice PDF generation, multi-user roles, and more analytics depth.

Thank you for being an early user. Your feedback shapes what we build next.`,
  },
];

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'all',          label: 'All Updates',  color: 'var(--text2)',   bg: 'var(--surface2)' },
  { key: 'feature',      label: 'New Feature',  color: '#8b5cf6',        bg: 'rgba(139,92,246,0.12)' },
  { key: 'update',       label: 'Update',       color: '#3b82f6',        bg: 'rgba(59,130,246,0.12)' },
  { key: 'fix',          label: 'Bug Fix',      color: '#f59e0b',        bg: 'rgba(245,158,11,0.12)' },
  { key: 'announcement', label: 'Announcement', color: '#22c55e',        bg: 'rgba(34,197,94,0.12)' },
];

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]));

const CAT_ICONS = {
  feature:      Sparkles,
  update:       Wrench,
  fix:          Bug,
  announcement: Megaphone,
};

function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function MarkdownText({ text }) {
  // Simple markdown: **bold**, newlines, bullet points
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return (
            <div key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text2)' }}>
              <span style={{ color: 'var(--accent3)', flexShrink: 0 }}>•</span>
              <span dangerouslySetInnerHTML={{ __html: bold.replace(/^[-•]\s/, '') }} />
            </div>
          );
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm font-bold mt-3" style={{ color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: bold }} />;
        }
        return <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }} dangerouslySetInnerHTML={{ __html: bold }} />;
      })}
    </div>
  );
}

function CategoryBadge({ cat, size = 'sm' }) {
  const c = CAT_MAP[cat] || CAT_MAP.all;
  const Icon = CAT_ICONS[cat] || Zap;
  return (
    <span className="inline-flex items-center gap-1 font-semibold rounded-full"
      style={{
        color: c.color, background: c.bg,
        padding: size === 'sm' ? '3px 10px' : '5px 14px',
        fontSize: size === 'sm' ? '11px' : '13px',
      }}>
      <Icon size={size === 'sm' ? 11 : 13} />
      {c.label}
    </span>
  );
}

function LikeButton({ updateId }) {
  const [count,  setCount]  = useState(0);
  const [liked,  setLiked]  = useState(false);
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sw-update-likes') || '{}');
      const likedIds = JSON.parse(localStorage.getItem('sw-update-liked-ids') || '[]');
      setCount(stored[updateId] || 0);
      setLiked(likedIds.includes(updateId));
    } catch {}
  }, [updateId]);

  const toggle = (e) => {
    e.stopPropagation();
    try {
      const stored   = JSON.parse(localStorage.getItem('sw-update-likes') || '{}');
      const likedIds = JSON.parse(localStorage.getItem('sw-update-liked-ids') || '[]');
      const wasLiked = likedIds.includes(updateId);
      const newCount = (stored[updateId] || 0) + (wasLiked ? -1 : 1);
      stored[updateId] = Math.max(0, newCount);
      const newLikedIds = wasLiked
        ? likedIds.filter(id => id !== updateId)
        : [...likedIds, updateId];
      localStorage.setItem('sw-update-likes', JSON.stringify(stored));
      localStorage.setItem('sw-update-liked-ids', JSON.stringify(newLikedIds));
      setCount(stored[updateId]);
      setLiked(!wasLiked);
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    } catch {}
  };

  return (
    <button onClick={toggle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
      style={{
        background: liked ? 'rgba(99,102,241,0.15)' : 'var(--surface2)',
        color: liked ? 'var(--accent3)' : 'var(--text3)',
        border: liked ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)',
        transform: bounce ? 'scale(1.15)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
      <ThumbsUp size={13} style={{ fill: liked ? 'var(--accent3)' : 'none' }} />
      {count > 0 && <span>{count}</span>}
      {count === 0 && <span>Like</span>}
    </button>
  );
}

function UpdateCard({ update, onReadMore }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = update.body.length > 400;

  return (
    <article
      className="card p-6 transition-all duration-200"
      style={{ borderLeft: `3px solid ${CAT_MAP[update.category]?.color || 'var(--border)'}` }}
      onMouseEnter={e => e.currentTarget.style.borderColor = CAT_MAP[update.category]?.color || 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = CAT_MAP[update.category]?.color || 'var(--border)'}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <CategoryBadge cat={update.category} />
            <span className="text-xs" style={{ color: 'var(--text3)' }}>{formatDate(update.date)}</span>
          </div>
          <h2 className="text-base font-bold leading-snug" style={{ color: 'var(--text)', letterSpacing: '-0.2px' }}>
            {update.title}
          </h2>
        </div>
        <LikeButton updateId={update.id} />
      </div>

      {/* Summary */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
        {update.summary}
      </p>

      {/* Expanded body */}
      {expanded && (
        <div className="mb-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <MarkdownText text={update.body} />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3">
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent3)' }}>
            {expanded
              ? <><ChevronUp size={14} /> Show Less</>
              : <><ChevronDown size={14} /> Read More</>}
          </button>
        )}
        {!isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent3)' }}>
            <ChevronDown size={14} /> Details
          </button>
        )}
        {expanded && !isLong && (
          <button
            onClick={() => setExpanded(false)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
            style={{ color: 'var(--accent3)' }}>
            <ChevronUp size={14} /> Close
          </button>
        )}
      </div>
    </article>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function UpdatesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOrder,      setSortOrder]      = useState('newest');
  const [search,         setSearch]         = useState('');

  const filtered = useMemo(() => {
    let list = [...UPDATES];
    if (activeCategory !== 'all') list = list.filter(u => u.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.title.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const diff = new Date(a.date) - new Date(b.date);
      return sortOrder === 'newest' ? -diff : diff;
    });
    return list;
  }, [activeCategory, sortOrder, search]);

  const counts = useMemo(() => {
    const c = { all: UPDATES.length };
    UPDATES.forEach(u => { c[u.category] = (c[u.category] || 0) + 1; });
    return c;
  }, []);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>App Updates — StockWise</title></Head>

        <div style={{ maxWidth: '760px', margin: '0 auto' }}>

          {/* Page header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Megaphone size={20} style={{ color: 'var(--accent3)' }} />
              </div>
              <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text)', letterSpacing: '-0.4px' }}>
                  App Updates
                </h1>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>
                  What's new in StockWise
                </p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
              <input
                type="text"
                placeholder="Search updates…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input pl-9 text-sm"
                style={{ height: '38px' }}
              />
            </div>

            {/* Filters row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category filters */}
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {CATEGORIES.map(cat => (
                  <button key={cat.key}
                    onClick={() => setActiveCategory(cat.key)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: activeCategory === cat.key ? cat.bg : 'var(--surface2)',
                      color: activeCategory === cat.key ? cat.color : 'var(--text3)',
                      border: activeCategory === cat.key
                        ? `1px solid ${cat.color}40`
                        : '1px solid var(--border)',
                    }}>
                    {cat.key !== 'all' && (() => { const I = CAT_ICONS[cat.key]; return <I size={11} />; })()}
                    {cat.label}
                    <span className="ml-0.5 opacity-60">{counts[cat.key] || 0}</span>
                  </button>
                ))}
              </div>

              {/* Sort */}
              <button
                onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0"
                style={{ background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                <ArrowUpDown size={12} />
                {sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          {filtered.length > 0 ? (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-px hidden sm:block"
                style={{ background: 'var(--border)', marginLeft: '-24px' }} />

              <div className="space-y-4">
                {filtered.map((update, idx) => (
                  <div key={update.id} className="relative animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}>
                    {/* Timeline dot */}
                    <div className="absolute hidden sm:block w-2.5 h-2.5 rounded-full"
                      style={{
                        left: '-28.5px', top: '24px',
                        background: CAT_MAP[update.category]?.color || 'var(--border)',
                        boxShadow: `0 0 0 3px var(--bg)`,
                      }} />
                    <UpdateCard update={update} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <Megaphone size={32} className="mb-3 opacity-20" style={{ color: 'var(--text3)' }} />
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>No updates found</p>
              <p className="text-sm" style={{ color: 'var(--text3)' }}>
                {search ? `No results for "${search}"` : 'No updates in this category yet.'}
              </p>
              {(search || activeCategory !== 'all') && (
                <button
                  onClick={() => { setSearch(''); setActiveCategory('all'); }}
                  className="mt-3 text-xs font-semibold"
                  style={{ color: 'var(--accent3)' }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                Showing {filtered.length} of {UPDATES.length} updates
              </p>
            </div>
          )}
        </div>

      </AppLayout>
    </ProtectedRoute>
  );
}
