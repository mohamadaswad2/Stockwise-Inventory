import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  User, Lock, Globe, Sparkles, Bell,
  CheckCircle2, Circle, Eye, EyeOff, RefreshCw, Send, ChevronDown,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import * as authService from '../../services/auth.service';
import { sendLowStockAlert } from '../../services/user.service';

const PW_CHECKS = [
  { label: 'At least 8 characters',    test: p => p.length >= 8 },
  { label: 'Uppercase letter (A–Z)',    test: p => /[A-Z]/.test(p) },
  { label: 'Lowercase letter (a–z)',    test: p => /[a-z]/.test(p) },
  { label: 'Number (0–9)',             test: p => /[0-9]/.test(p) },
  { label: 'Special character (!@#…)', test: p => /[^A-Za-z0-9]/.test(p) },
];

const CURRENCIES = [
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'USD', label: 'US Dollar',         symbol: '$',  flag: '🇺🇸' },
];

const PLAN_COLORS = {
  deluxe:  { bg: 'rgba(99,102,241,0.12)',  color: 'var(--accent3)', label: 'DELUXE' },
  premium: { bg: 'rgba(168,85,247,0.12)', color: 'var(--purple)',  label: 'PREMIUM' },
  starter: { bg: 'rgba(34,197,94,0.12)',  color: 'var(--green)',   label: 'STARTER' },
  free:    { bg: 'rgba(148,163,184,0.1)', color: 'var(--text2)',   label: 'FREE' },
};

// Reusable section wrapper
function Section({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,0.1)' }}>
          <Icon size={14} style={{ color: 'var(--accent3)' }} />
        </div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { currency, switchCurrency, rateDate } = useCurrency();

  // #13 — hide new/confirm until current password filled
  const [pw,       setPw]       = useState({ current: '', new: '', confirm: '' });
  const [showPw,   setShowPw]   = useState({ current: false, new: false });
  const [saving,   setSaving]   = useState(false);
  const [alerting, setAlerting] = useState(false);

  const noSpaces    = v => v.replace(/\s/g, '');
  const showNewPw   = pw.current.length >= 1; // #13 — show new fields only after current entered
  const passed      = PW_CHECKS.filter(c => c.test(pw.new)).length;
  const isStrong    = passed === PW_CHECKS.length;
  const pwColors    = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#6366f1'];
  const pwLabels    = ['Very Weak','Weak','Fair','Strong','Very Strong'];

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!isStrong)             { toast.error('Password does not meet requirements.'); return; }
    if (pw.new !== pw.confirm) { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.current, newPassword: pw.new });
      toast.success('Password updated!');
      setPw({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const handleSendAlert = async () => {
    setAlerting(true);
    try {
      const res = await sendLowStockAlert();
      toast.success(res.data.message, { duration: 5000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send alert.');
    } finally { setAlerting(false); }
  };

  const plan = PLAN_COLORS[user?.plan] || PLAN_COLORS.free;
  const trialDays = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000))
    : null;
  const isPaid = user?.plan !== 'free';

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Settings — StockWise</title></Head>

        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>Account & preferences</p>
        </div>

        {/* ── ROW 1: Profile (left) + Subscription (right) ── #3 fix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* Profile */}
          <Section title="Profile" icon={User}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-bold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
                <p className="text-sm truncate mb-2" style={{ color: 'var(--text2)' }}>{user?.email}</p>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: plan.bg, color: plan.color }}>
                  {plan.label}
                </span>
              </div>
            </div>

            {/* Currency — #3: duduk dalam profile section */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--text3)' }}>
                Display Currency
              </p>
              <div className="grid grid-cols-2 gap-2">
                {CURRENCIES.map(({ code, label, symbol, flag }) => {
                  const active = currency === code;
                  return (
                    <button key={code}
                      onClick={() => { switchCurrency(code); toast.success(`Currency: ${code}`); }}
                      className="flex items-center gap-2.5 p-3 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: active ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      <span className="text-lg">{flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{symbol} {code}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{label}</p>
                      </div>
                      {active && (
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--accent)' }}>
                          <span className="text-white" style={{ fontSize: '9px', fontWeight: 900 }}>✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {rateDate && (
                <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--text3)' }}>
                  <RefreshCw size={10} />
                  {rateDate === 'offline' ? 'Offline rates in use.' : `Rates updated: ${rateDate}`}
                </p>
              )}
            </div>
          </Section>

          {/* Subscription */}
          <Section title="Subscription" icon={Sparkles}>
            {trialDays !== null && trialDays > 0 && !user?.stripe_subscription_id ? (
              <div className="space-y-3">
                {/* Trial card */}
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--accent3)' }}>✨ Deluxe Trial</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                      Expires {user?.trial_ends_at
                        ? new Date(user.trial_ends_at).toLocaleDateString('en-MY', { day:'numeric', month:'short', year:'numeric' })
                        : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black" style={{ color: 'var(--accent3)' }}>{trialDays}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>days left</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text3)' }}>
                    <span>Progress</span>
                    <span>{30 - trialDays}/30 days</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${((30 - trialDays) / 30) * 100}%`,
                        background: trialDays <= 3
                          ? 'var(--red)'
                          : 'linear-gradient(90deg,var(--accent),var(--accent2))',
                      }} />
                  </div>
                </div>
                <Link href="/settings/billing" className="btn-primary w-full justify-center text-sm">
                  Upgrade Now — Keep All Features
                </Link>
              </div>
            ) : user?.stripe_subscription_id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--green)' }} />
                  <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>Active Subscription</p>
                </div>
                <Link href="/settings/billing" className="btn-secondary w-full justify-center text-sm">
                  Manage Subscription
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  You're on the <strong style={{ color: 'var(--text)' }}>Free</strong> plan.
                </p>
                <div className="space-y-2">
                  {['CSV Export','Email Alerts','Advanced Analytics'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text3)' }}>
                      <span style={{ color: 'var(--red)' }}>✕</span> {f} not available
                    </div>
                  ))}
                </div>
                <Link href="/settings/billing" className="btn-primary w-full justify-center text-sm">
                  View Plans
                </Link>
              </div>
            )}
          </Section>
        </div>

        {/* ── ROW 2: Password (left) + Low Stock Alerts (right) ── #3 + #12 fix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Change Password — #13: hide new/confirm until current entered */}
          <Section title="Change Password" icon={Lock}>
            <form onSubmit={handleChangePw} className="space-y-3">

              {/* Current password — always visible */}
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="Enter current password"
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: noSpaces(e.target.value) }))}
                    autoComplete="current-password"
                    required />
                  <button type="button"
                    onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text3)' }}>
                    {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* #13 — new + confirm only show after current has content */}
              {showNewPw && (
                <>
                  {/* New password */}
                  <div className="animate-fade-in">
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPw.new ? 'text' : 'password'}
                        className="input pr-11"
                        placeholder="Create strong password"
                        value={pw.new}
                        onChange={e => setPw(p => ({ ...p, new: noSpaces(e.target.value) }))}
                        autoComplete="new-password"
                        required />
                      <button type="button"
                        onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ color: 'var(--text3)' }}>
                        {showPw.new ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {pw.new && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface3)' }}>
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(passed / PW_CHECKS.length) * 100}%`,
                                background: pwColors[passed - 1] || 'transparent',
                              }} />
                          </div>
                          <span className="text-xs font-bold w-20 text-right"
                            style={{ color: pwColors[passed - 1] || 'var(--text3)' }}>
                            {pwLabels[passed - 1] || 'Too Weak'}
                          </span>
                        </div>
                        {PW_CHECKS.map(c => {
                          const ok = c.test(pw.new);
                          return (
                            <div key={c.label} className="flex items-center gap-2">
                              {ok
                                ? <CheckCircle2 size={11} style={{ color: 'var(--green)', flexShrink: 0 }} />
                                : <Circle      size={11} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
                              <span className="text-xs" style={{ color: ok ? 'var(--green)' : 'var(--text2)' }}>
                                {c.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div className="animate-fade-in">
                    <label className="label">Confirm New Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Re-enter new password"
                      value={pw.confirm}
                      onChange={e => setPw(p => ({ ...p, confirm: noSpaces(e.target.value) }))}
                      autoComplete="new-password"
                      required />
                    {pw.confirm && pw.new !== pw.confirm && (
                      <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>Passwords do not match.</p>
                    )}
                  </div>

                  <button type="submit" disabled={saving || !isStrong} className="btn-primary w-full">
                    <Lock size={13} />
                    {saving ? 'Updating…' : 'Update Password'}
                  </button>
                </>
              )}

              {/* Hint when fields hidden */}
              {!showNewPw && (
                <p className="text-xs" style={{ color: 'var(--text3)' }}>
                  Enter your current password to set a new one.
                </p>
              )}
            </form>
          </Section>

          {/* Low Stock Alerts — #12: aligned in grid */}
          <Section title="Low Stock Alerts" icon={Bell}>
            <div className="space-y-3">
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
                Get email alerts every <strong style={{ color: 'var(--text)' }}>6 hours</strong> when
                items drop below their restock threshold.
              </p>

              {/* Info grid */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {[
                  { label: 'Auto alerts', value: isPaid ? '✓ Active' : 'Paid plan only', ok: isPaid },
                  { label: 'Frequency',   value: 'Every 6 hours',  ok: true },
                  { label: 'Sent to',     value: user?.email || '—', ok: true },
                ].map(({ label, value, ok }, i, arr) => (
                  <div key={label}
                    className="flex items-center justify-between px-4 py-2.5"
                    style={{
                      background: 'var(--surface2)',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>{label}</span>
                    <span className="text-xs font-bold truncate max-w-[160px] text-right"
                      style={{ color: ok && isPaid ? 'var(--green)' : !isPaid && label === 'Auto alerts' ? 'var(--orange)' : 'var(--text)' }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSendAlert}
                disabled={alerting || !isPaid}
                className="w-full btn text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{
                  background: isPaid ? 'var(--surface2)' : 'var(--surface2)',
                  color: isPaid ? 'var(--text)' : 'var(--text3)',
                  border: `1px solid ${isPaid ? 'var(--border2)' : 'var(--border)'}`,
                  cursor: isPaid ? 'pointer' : 'not-allowed',
                  opacity: isPaid ? 1 : 0.5,
                }}>
                <Send size={14} />
                {alerting ? 'Sending…' : 'Send Test Alert Now'}
              </button>

              {!isPaid && (
                <div className="text-center">
                  <Link href="/settings/billing"
                    className="text-xs font-semibold underline underline-offset-2"
                    style={{ color: 'var(--accent3)' }}>
                    Upgrade to enable alerts →
                  </Link>
                </div>
              )}
            </div>
          </Section>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
