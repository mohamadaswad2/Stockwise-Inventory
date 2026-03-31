import Head from 'next/head';
import Link from 'next/link';
import { Check, Zap, Star, Crown } from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    icon: Zap,
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
      '1 user account',
    ],
    notIncluded: ['Advanced analytics', 'Multi-user access', 'Priority support'],
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: Star,
    price: { MYR: 39, USD: 8 },
    color: 'var(--purple)',
    colorBg: 'rgba(168,85,247,0.1)',
    popular: true,
    description: 'For growing businesses that need more power.',
    features: [
      'Unlimited inventory items',
      'CSV export (6× per month)',
      'Low stock email alerts',
      'Advanced sales analytics',
      'Profit & cost tracking',
      '3 user accounts',
      'Priority email support',
    ],
    notIncluded: ['Multi-user roles', 'API access'],
  },
  {
    key: 'deluxe',
    name: 'Deluxe',
    icon: Crown,
    price: { MYR: 69, USD: 15 },
    color: 'var(--accent3)',
    colorBg: 'rgba(99,102,241,0.1)',
    description: 'Everything you need to scale your business.',
    features: [
      'Unlimited inventory items',
      'Unlimited CSV exports',
      'Low stock email alerts',
      'Full analytics suite',
      'Profit & cost tracking',
      'Unlimited user accounts',
      'Multi-user roles',
      'Priority support',
      'Early access to new features',
    ],
    notIncluded: [],
  },
];

export default function BillingPage() {
  const { user } = useAuth();
  const currentPlan = user?.plan || 'free';

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Upgrade Plan — StockWise</title></Head>

        <div className="mb-8 text-center max-w-2xl mx-auto">
          <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
            Choose your plan
          </h1>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            Start with a 30-day Deluxe trial, then pick the plan that fits your business.
            All plans include your data — <strong style={{ color: 'var(--text)' }}>never deleted</strong>, only locked if subscription expires.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {PLANS.map(({ key, name, icon: Icon, price, color, colorBg, popular, description, features, notIncluded }) => {
            const isCurrent = currentPlan === key;
            return (
              <div key={key} className="card overflow-hidden flex flex-col transition-all duration-200"
                style={{
                  border: popular ? `2px solid ${color}` : isCurrent ? `2px solid var(--accent)` : '1px solid var(--border)',
                  transform: popular ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: popular ? `0 0 40px ${colorBg}` : 'none',
                }}>

                {/* Popular badge */}
                {popular && (
                  <div className="text-center py-2 text-xs font-black"
                    style={{ background: color, color: '#fff' }}>
                    ⭐ MOST POPULAR
                  </div>
                )}
                {isCurrent && !popular && (
                  <div className="text-center py-2 text-xs font-black"
                    style={{ background: 'var(--accent)', color: '#fff' }}>
                    ✓ CURRENT PLAN
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: colorBg }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <h3 className="text-lg font-black" style={{ color: 'var(--text)' }}>{name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black" style={{ color: 'var(--text)' }}>
                        RM {price.MYR}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text2)' }}>/month</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                      ≈ ${price.USD} USD · billed monthly
                    </p>
                  </div>

                  <p className="text-xs mb-4" style={{ color: 'var(--text2)' }}>{description}</p>

                  {/* Features */}
                  <div className="space-y-2 flex-1">
                    {features.map(f => (
                      <div key={f} className="flex items-start gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: colorBg }}>
                          <Check size={10} style={{ color }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text)' }}>{f}</span>
                      </div>
                    ))}
                    {notIncluded.map(f => (
                      <div key={f} className="flex items-start gap-2 opacity-40">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: 'var(--surface2)' }}>
                          <span style={{ fontSize: '8px', color: 'var(--text3)' }}>✕</span>
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text3)' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-5">
                    {isCurrent ? (
                      <div className="w-full py-2.5 text-center text-sm font-bold rounded-xl"
                        style={{ background: 'var(--surface2)', color: 'var(--text2)' }}>
                        Current Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          // TODO: integrate Stripe
                          alert(`Stripe payment coming soon!\n\nPlan: ${name}\nPrice: RM${price.MYR}/month\n\nContact us to upgrade manually for now.`);
                        }}
                        className="w-full py-2.5 text-center text-sm font-bold rounded-xl text-white transition-all"
                        style={{ background: `linear-gradient(135deg,${color},${color}cc)` }}>
                        Upgrade to {name}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Free plan note */}
        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            🔒 Your data is <strong style={{ color: 'var(--text2)' }}>never deleted</strong> — it's locked until you subscribe.
            Cancel anytime. Questions?{' '}
            <a href="mailto:support@stockwise.app" className="underline" style={{ color: 'var(--accent3)' }}>
              support@stockwise.app
            </a>
          </p>
        </div>

        {/* Free plan comparison */}
        <div className="mt-8 max-w-5xl mx-auto card p-5">
          <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>Free Plan (current if no subscription)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Items', value: '100', note: 'max' },
              { label: 'CSV Export', value: '✕', note: 'not available' },
              { label: 'Email Alerts', value: '✕', note: 'not available' },
              { label: 'Users', value: '1', note: 'only you' },
            ].map(({ label, value, note }) => (
              <div key={label} className="p-3 rounded-xl" style={{ background: 'var(--surface2)' }}>
                <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{value}</p>
                <p className="text-xs font-bold" style={{ color: 'var(--text2)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{note}</p>
              </div>
            ))}
          </div>
        </div>

      </AppLayout>
    </ProtectedRoute>
  );
}
