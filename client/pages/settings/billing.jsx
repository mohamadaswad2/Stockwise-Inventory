import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Check, Zap, Star, Crown, Loader2, Settings } from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { createCheckoutSession, createPortalSession } from '../../services/stripe.service';

const PLANS = [
  {
    key:   'starter',
    name:  'Starter',
    icon:  Zap,
    price: { MYR: 19, USD: 4 },
    color: 'var(--green)',
    colorBg: 'rgba(34,197,94,0.1)',
    description: 'Perfect for small businesses just getting started.',
    features: [
      'Up to 500 inventory items',
      'CSV export (3× per month)',
      'Low stock email alerts',
      'Sales tracking & reports',
      'Dashboard analytics',
    ],
  },
  {
    key:     'premium',
    name:    'Premium',
    icon:    Star,
    price:   { MYR: 39, USD: 8 },
    color:   'var(--purple)',
    colorBg: 'rgba(168,85,247,0.1)',
    popular: true,
    description: 'For growing businesses that need more power.',
    features: [
      'Unlimited inventory items',
      'CSV export (6× per month)',
      'Low stock email alerts',
      'Advanced sales analytics',
      'Profit & cost tracking',
      'Priority email support',
    ],
  },
  {
    key:     'deluxe',
    name:    'Deluxe',
    icon:    Crown,
    price:   { MYR: 69, USD: 15 },
    color:   'var(--accent3)',
    colorBg: 'rgba(99,102,241,0.1)',
    description: 'Everything you need to scale your business.',
    features: [
      'Unlimited inventory items',
      'Unlimited CSV exports',
      'Full analytics suite (3M history)',
      'Profit & cost tracking',
      'Priority support',
      'Early access to new features',
    ],
  },
];

export default function BillingPage() {
  const { user, refreshUser } = useAuth();
  const { currency }          = useCurrency();
  const router                = useRouter();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlan = user?.plan || 'free';
  const hasActiveSub = !!user?.stripe_subscription_id;

  // Handle redirect back from Stripe
  useEffect(() => {
    if (router.query.success) {
      const plan = router.query.plan;
      toast.success(`🎉 Upgrade successful! Welcome to ${plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'your new plan'}!`, { duration: 6000 });
      refreshUser?.();
      // Clean URL
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
      window.location.href = url; // redirect to Stripe Checkout
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

  const getButtonLabel = (plan) => {
    if (loadingPlan === plan) return <><Loader2 size={14} className="animate-spin" /> Redirecting…</>;
    if (currentPlan === plan) return hasActiveSub ? 'Current Plan' : 'Active (Trial)';
    if (['starter','premium','deluxe'].indexOf(plan) < ['starter','premium','deluxe'].indexOf(currentPlan))
      return 'Downgrade';
    return 'Upgrade Now';
  };

  const isCurrentPlan = (plan) => currentPlan === plan;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Upgrade Plan — StockWise</title></Head>

        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Upgrade Plan</h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
                Choose the plan that fits your business
              </p>
            </div>
            {hasActiveSub && (
              <button onClick={handleManage} disabled={portalLoading}
                className="btn-secondary text-sm flex items-center gap-2">
                {portalLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Opening…</>
                  : <><Settings size={14} /> Manage Subscription</>}
              </button>
            )}
          </div>

          {/* Current plan banner */}
          <div className="mt-4 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span className="text-sm" style={{ color: 'var(--text2)' }}>
              Current plan:{' '}
              <strong style={{ color: 'var(--text)' }}>
                {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
              </strong>
              {hasActiveSub && <span className="ml-2 text-xs" style={{ color: 'var(--green)' }}>● Active</span>}
              {user?.trial_ends_at && !hasActiveSub && (
                <span className="ml-2 text-xs" style={{ color: 'var(--orange)' }}>
                  Trial ends {new Date(user.trial_ends_at).toLocaleDateString('en-MY')}
                </span>
              )}
            </span>
            <Link href="/settings" className="text-xs font-semibold" style={{ color: 'var(--accent3)' }}>
              View Settings →
            </Link>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const Icon    = plan.icon;
            const price   = plan.price[currency] || plan.price.MYR;
            const symbol  = currency === 'USD' ? '$' : 'RM';
            const current = isCurrentPlan(plan.key);

            return (
              <div key={plan.key}
                className="card overflow-hidden relative flex flex-col transition-all duration-200"
                style={{
                  border: current
                    ? `2px solid ${plan.color}`
                    : plan.popular
                      ? '2px solid var(--border2)'
                      : '1px solid var(--border)',
                }}
                onMouseEnter={e => { if (!current) e.currentTarget.style.borderColor = plan.color; }}
                onMouseLeave={e => { if (!current) e.currentTarget.style.borderColor = plan.popular ? 'var(--border2)' : 'var(--border)'; }}>

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px">
                    <div className="px-3 py-0.5 rounded-b-lg text-xs font-bold text-white"
                      style={{ background: plan.color }}>
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-5 pt-6 flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.colorBg }}>
                      <Icon size={20} style={{ color: plan.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text)' }}>{plan.name}</h3>
                      <p className="text-xs" style={{ color: 'var(--text3)' }}>{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-black" style={{ color: 'var(--text)' }}>
                      {symbol}{price}
                    </span>
                    <span className="text-sm ml-1" style={{ color: 'var(--text3)' }}>/month</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: plan.color }} />
                        <span style={{ color: 'var(--text2)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-5 pb-5">
                  <button
                    onClick={() => !current && handleUpgrade(plan.key)}
                    disabled={current || !!loadingPlan}
                    className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: current
                        ? plan.colorBg
                        : `linear-gradient(135deg, ${plan.color}, ${plan.color}cc)`,
                      color: current ? plan.color : '#fff',
                      opacity: loadingPlan && loadingPlan !== plan.key ? 0.5 : 1,
                      cursor: current || loadingPlan ? 'not-allowed' : 'pointer',
                    }}>
                    {getButtonLabel(plan.key)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment info */}
        <div className="mt-6 text-center space-y-1">
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            🔒 Secure payment powered by Stripe. Cancel anytime from your billing portal.
          </p>
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            All prices in {currency === 'USD' ? 'USD' : 'MYR (Malaysian Ringgit)'}. Billed monthly.
          </p>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
