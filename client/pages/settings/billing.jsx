import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import {
  Check, X, Zap, Star, Crown, Loader2, Settings,
  Shield, CreditCard, RefreshCw, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { createCheckoutSession, createPortalSession } from '../../services/stripe.service';

/* ── Plan definitions ─────────────────────────────────────────────────────── */
const PLANS = [
  {
    key:         'starter',
    name:        'Starter',
    icon:        Zap,
    price:       { MYR: 19, USD: 4 },
    accentColor: '#18a349',
    accentBg:    'rgba(24,163,73,0.1)',
    accentBorder:'rgba(24,163,73,0.2)',
    tagline:     'For businesses just getting started',
    features: [
      { label: 'Inventory items',       value: 'Up to 500',    included: true  },
      { label: 'CSV export',            value: '3× per month', included: true  },
      { label: 'Low stock email alerts',value: 'Included',     included: true  },
      { label: 'Sales analytics',       value: 'Basic',        included: true  },
      { label: 'Profit tracking',       value: null,           included: false },
      { label: 'Advanced analytics (3M)',value: null,          included: false },
      { label: 'Priority support',      value: null,           included: false },
    ],
  },
  {
    key:         'premium',
    name:        'Premium',
    icon:        Star,
    price:       { MYR: 39, USD: 8 },
    accentColor: '#8e4ec6',
    accentBg:    'rgba(142,78,198,0.1)',
    accentBorder:'rgba(142,78,198,0.25)',
    tagline:     'Most popular for growing businesses',
    popular:     true,
    features: [
      { label: 'Inventory items',       value: 'Unlimited',    included: true },
      { label: 'CSV export',            value: '6× per month', included: true },
      { label: 'Low stock email alerts',value: 'Included',     included: true },
      { label: 'Sales analytics',       value: 'Advanced',     included: true },
      { label: 'Profit tracking',       value: 'Full details', included: true },
      { label: 'Advanced analytics (3M)',value: 'Unlocked',    included: false },
      { label: 'Priority support',      value: 'Email',        included: true },
    ],
  },
  {
    key:         'deluxe',
    name:        'Deluxe',
    icon:        Crown,
    price:       { MYR: 69, USD: 15 },
    accentColor: '#5b5bd6',
    accentBg:    'rgba(91,91,214,0.1)',
    accentBorder:'rgba(91,91,214,0.25)',
    tagline:     'Everything you need to scale',
    features: [
      { label: 'Inventory items',       value: 'Unlimited',    included: true },
      { label: 'CSV export',            value: 'Unlimited',    included: true },
      { label: 'Low stock email alerts',value: 'Included',     included: true },
      { label: 'Sales analytics',       value: 'Full suite',   included: true },
      { label: 'Profit tracking',       value: 'Full details', included: true },
      { label: 'Advanced analytics (3M)',value: '3 months',    included: true },
      { label: 'Priority support',      value: 'Top priority', included: true },
    ],
  },
];

/* ── Trial countdown ──────────────────────────────────────────────────────── */
function TrialCountdown({ trialEndsAt }) {
  if (!trialEndsAt) return null;
  const daysLeft = Math.ceil((new Date(trialEndsAt) - new Date()) / 86400000);
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;
  const warn   = daysLeft <= 7;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 12, marginBottom: 20,
      background: urgent ? 'var(--red-bg)'    : warn ? 'var(--orange-bg)' : 'var(--accent-bg)',
      border:    `1px solid ${urgent ? 'rgba(229,72,77,0.25)' : warn ? 'rgba(255,139,62,0.25)' : 'rgba(91,91,214,0.2)'}`,
    }}>
      <Clock size={16} style={{ color: urgent ? 'var(--red)' : warn ? 'var(--orange)' : 'var(--accent3)', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {daysLeft === 1 ? 'Trial ends tomorrow!' : `${daysLeft} days left in your free trial`}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
          Upgrade now to keep your data and full access after the trial ends.
        </p>
      </div>
      {urgent && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
          background: 'var(--red)', color: '#fff', flexShrink: 0,
        }}>Urgent</span>
      )}
    </div>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can cancel your subscription at any time from the billing portal. Your access continues until the end of the billing period.',
  },
  {
    q: 'What happens after my trial ends?',
    a: 'Your data is locked but never deleted. You can upgrade at any time to restore full access immediately.',
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes. Upgrade instantly — effective immediately. To downgrade, use the billing portal and changes take effect at your next billing cycle.',
  },
  {
    q: 'Is my payment secure?',
    a: 'All payments are processed by Stripe, the same payment infrastructure used by Amazon, Google and Shopify. We never store your card details.',
  },
];

function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ marginTop: 32 }}>
      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.2px' }}>
        Frequently Asked Questions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {FAQS.map((faq, i) => (
          <div key={i} className="card" style={{ overflow: 'hidden', borderRadius: 10 }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', gap: 12,
              }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{faq.q}</span>
              {open === i
                ? <ChevronUp size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                : <ChevronDown size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
            </button>
            {open === i && (
              <div style={{ padding: '0 16px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Plan card ────────────────────────────────────────────────────────────── */
function PlanCard({ plan, current, hasActiveSub, currentPlan, loadingPlan, onUpgrade, onManage, currency }) {
  const Icon     = plan.icon;
  const price    = plan.price[currency] || plan.price.MYR;
  const symbol   = currency === 'USD' ? '$' : 'RM';
  const isCurrent = current;
  const planOrder = ['starter', 'premium', 'deluxe'];
  const isDowngrade = planOrder.indexOf(plan.key) < planOrder.indexOf(currentPlan);
  const isLoading   = loadingPlan === plan.key;

  const handleClick = () => {
    if (isCurrent || loadingPlan) return;
    if (isDowngrade && hasActiveSub) { onManage(); return; }
    onUpgrade(plan.key);
  };

  const btnLabel = () => {
    if (isLoading) return <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Redirecting…</>;
    if (isCurrent) return hasActiveSub ? '✓ Current Plan' : '✓ Active (Trial)';
    if (isDowngrade && hasActiveSub) return 'Downgrade via Portal';
    if (isDowngrade) return 'Downgrade';
    return `Upgrade to ${plan.name}`;
  };

  return (
    <div style={{
      position: 'relative',
      background: plan.popular ? `linear-gradient(160deg, ${plan.accentBg}, var(--surface))` : 'var(--surface)',
      border: isCurrent ? `2px solid ${plan.accentColor}` : plan.popular ? `2px solid ${plan.accentBorder}` : '1px solid var(--border)',
      borderRadius: 18,
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: plan.popular ? `0 0 32px ${plan.accentColor}18` : 'var(--shadow-sm)',
      transition: 'transform 200ms ease, box-shadow 200ms ease',
    }}
    onMouseEnter={e => {
      if (!isCurrent) {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 32px ${plan.accentColor}28`;
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = plan.popular ? `0 0 32px ${plan.accentColor}18` : 'var(--shadow-sm)';
    }}>

      {/* Popular ribbon */}
      {plan.popular && (
        <div style={{
          background: `linear-gradient(135deg, ${plan.accentColor}, ${plan.accentColor}cc)`,
          color: '#fff', fontSize: 10, fontWeight: 700,
          padding: '5px 14px', textAlign: 'center',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          ⭐ Most Popular
        </div>
      )}

      {/* Current indicator */}
      {isCurrent && !plan.popular && (
        <div style={{
          background: plan.accentBg, color: plan.accentColor,
          fontSize: 10, fontWeight: 700, padding: '5px 14px',
          textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase',
          borderBottom: `1px solid ${plan.accentBorder}`,
        }}>
          ✓ Your Current Plan
        </div>
      )}
      {isCurrent && plan.popular && (
        <div style={{
          position: 'absolute', top: 28, right: 12,
          background: plan.accentBg, color: plan.accentColor,
          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
          border: `1px solid ${plan.accentBorder}`,
        }}>✓ CURRENT</div>
      )}

      <div style={{ padding: '20px 20px 16px', flex: 1 }}>
        {/* Plan header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: plan.accentBg, border: `1px solid ${plan.accentBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={19} style={{ color: plan.accentColor }} />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', letterSpacing: '-0.3px' }}>{plan.name}</p>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{plan.tagline}</p>
          </div>
        </div>

        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 18 }}>
          <span style={{ fontSize: 34, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1 }}>
            {symbol}{price}
          </span>
          <span style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>/month</span>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plan.features.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                background: f.included ? plan.accentBg : 'var(--surface2)',
                border: `1px solid ${f.included ? plan.accentBorder : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.included
                  ? <Check size={10} style={{ color: plan.accentColor }} />
                  : <X size={9} style={{ color: 'var(--text3)', opacity: 0.5 }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: 12, color: f.included ? 'var(--text2)' : 'var(--text3)',
                  opacity: f.included ? 1 : 0.55,
                  textDecoration: f.included ? 'none' : 'none',
                }}>{f.label}</span>
                {f.included && f.value && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, marginLeft: 6,
                    color: plan.accentColor,
                  }}>— {f.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <div style={{ padding: '0 20px 20px' }}>
        <button
          onClick={handleClick}
          disabled={isCurrent || !!loadingPlan}
          style={{
            width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            cursor: isCurrent || loadingPlan ? 'not-allowed' : 'pointer',
            background: isCurrent
              ? plan.accentBg
              : `linear-gradient(135deg, ${plan.accentColor}, ${plan.accentColor}cc)`,
            color: isCurrent ? plan.accentColor : '#fff',
            border: isCurrent ? `1px solid ${plan.accentBorder}` : 'none',
            opacity: loadingPlan && !isLoading ? 0.55 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transition: 'opacity 150ms, transform 150ms',
            boxShadow: !isCurrent ? `0 4px 14px ${plan.accentColor}35` : 'none',
          }}
          onMouseEnter={e => { if (!isCurrent && !loadingPlan) e.currentTarget.style.opacity = '0.88'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = (loadingPlan && !isLoading) ? '0.55' : '1'; }}>
          {btnLabel()}
        </button>
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────────────────────────── */
export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const { currency }          = useCurrency();
  const router                = useRouter();
  const [loadingPlan,   setLoadingPlan]   = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlan  = user?.plan || 'free';
  const hasActiveSub = !!user?.stripe_subscription_id;
  const trialEndsAt  = user?.trial_ends_at;

  useEffect(() => {
    if (router.query.success) {
      const plan = router.query.plan;
      toast.success(`🎉 Welcome to ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'your new plan'}!`, { duration: 6000 });
      refreshUser?.();
      router.replace('/settings/billing', undefined, { shallow: true });
    }
    if (router.query.cancelled) {
      toast('Payment cancelled.', { icon: 'ℹ️' });
      router.replace('/settings/billing', undefined, { shallow: true });
    }
  }, [router.query]);

  const handleUpgrade = async (plan) => {
    if (loadingPlan) return;
    setLoadingPlan(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start checkout. Please try again.');
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      toast.error('Failed to open billing portal.');
      setPortalLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Billing & Plans — StockWise</title></Head>

        {/* ── Page header ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 className="page-title">Billing & Plans</h1>
            <p className="page-subtitle">Choose the plan that fits your business</p>
          </div>
          {hasActiveSub && (
            <button onClick={handleManage} disabled={portalLoading}
              className="btn-secondary"
              style={{ height: 36, paddingLeft: 12, paddingRight: 12, fontSize: 13, gap: 6, flexShrink: 0 }}>
              {portalLoading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Opening…</>
                : <><Settings size={13} /> Manage</>}
            </button>
          )}
        </div>

        {/* ── Trial countdown (when on trial) ─────────────────────── */}
        {trialEndsAt && !hasActiveSub && <TrialCountdown trialEndsAt={trialEndsAt} />}

        {/* ── Current plan status bar ──────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderRadius: 12, marginBottom: 24, gap: 12,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: hasActiveSub ? 'var(--green)' : trialEndsAt ? 'var(--orange)' : 'var(--text3)',
              boxShadow: hasActiveSub ? '0 0 6px var(--green)' : 'none',
            }} />
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              Current plan:{' '}
              <strong style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{currentPlan}</strong>
              {hasActiveSub && (
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>Active</span>
              )}
              {trialEndsAt && !hasActiveSub && (
                <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--orange)', fontWeight: 600 }}>
                  Trial · {Math.max(0, Math.ceil((new Date(trialEndsAt) - new Date()) / 86400000))}d left
                </span>
              )}
            </p>
          </div>
          <Link href="/settings"
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)', textDecoration: 'none', flexShrink: 0 }}>
            Account Settings →
          </Link>
        </div>

        {/* ── Plan cards ───────────────────────────────────────────── */}
        {/* Mobile: horizontal scroll snap | Desktop: 3-col grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14,
        }} className="billing-grid">
          {PLANS.map(plan => (
            <PlanCard
              key={plan.key}
              plan={plan}
              current={currentPlan === plan.key}
              hasActiveSub={hasActiveSub}
              currentPlan={currentPlan}
              loadingPlan={loadingPlan}
              onUpgrade={handleUpgrade}
              onManage={handleManage}
              currency={currency}
            />
          ))}
        </div>

        {/* ── Trust strip ──────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap',
          marginTop: 24, padding: '16px 20px', borderRadius: 12,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          {[
            { icon: Shield,      text: 'Secure payments via Stripe' },
            { icon: RefreshCw,   text: 'Cancel anytime, no lock-in' },
            { icon: CreditCard,  text: 'MYR local pricing' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text3)' }}>
              <Icon size={13} style={{ color: 'var(--accent3)' }} /> {text}
            </span>
          ))}
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <FAQ />

        {/* Responsive CSS */}
        <style>{`
          @media (max-width: 640px) {
            .billing-grid {
              grid-template-columns: 1fr !important;
              gap: 12px !important;
            }
          }
          @media (min-width: 641px) and (max-width: 900px) {
            .billing-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </AppLayout>
    </ProtectedRoute>
  );
}
