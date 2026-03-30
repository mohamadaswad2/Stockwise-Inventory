/**
 * /settings — Full settings page (replaces modal).
 * Sections: Profile, Password, Currency, Subscription
 */
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  User, Lock, Globe, Sparkles, CheckCircle2, Circle,
  Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import * as authService from '../../services/auth.service';

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
  deluxe:  { bg: 'rgba(99,102,241,0.12)',  color: 'var(--accent3)',  label: 'DELUXE' },
  premium: { bg: 'rgba(168,85,247,0.12)', color: 'var(--purple)',   label: 'PREMIUM' },
  starter: { bg: 'rgba(34,197,94,0.12)',  color: 'var(--green)',    label: 'STARTER' },
  free:    { bg: 'rgba(148,163,184,0.1)', color: 'var(--text2)',    label: 'FREE' },
};

function Section({ title, icon: Icon, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.12)' }}>
          <Icon size={16} style={{ color: 'var(--accent3)' }} />
        </div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { currency, switchCurrency, rateDate } = useCurrency();

  // Password form state
  const [pw,      setPw]      = useState({ current: '', new: '', confirm: '' });
  const [showPw,  setShowPw]  = useState({ current: false, new: false });
  const [saving,  setSaving]  = useState(false);

  const passed   = PW_CHECKS.filter(c => c.test(pw.new)).length;
  const isStrong = passed === PW_CHECKS.length;
  const noSpaces = (val) => val.replace(/\s/g, ''); // strip spaces
  const colors   = ['#ef4444','#f59e0b','#f59e0b','#22c55e','#6366f1'];
  const labels   = ['Very Weak','Weak','Fair','Strong','Very Strong'];

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (!isStrong)              { toast.error('Password does not meet requirements.'); return; }
    if (pw.new !== pw.confirm)  { toast.error('Passwords do not match.'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.current, newPassword: pw.new });
      toast.success('Password updated successfully!');
      setPw({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const plan = PLAN_COLORS[user?.plan] || PLAN_COLORS.free;
  const trialDays = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000))
    : null;

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Settings — StockWise</title></Head>

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>
            Manage your account preferences
          </p>
        </div>

        <div className="space-y-5 max-w-2xl">

          {/* ── Profile ── */}
          <Section title="Profile" icon={User}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>{user?.name}</p>
                <p className="text-sm" style={{ color: 'var(--text2)' }}>{user?.email}</p>
                <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: plan.bg, color: plan.color }}>
                  {plan.label} PLAN
                </span>
              </div>
            </div>
          </Section>

          {/* ── Subscription ── */}
          <Section title="Subscription" icon={Sparkles}>
            {trialDays !== null && trialDays > 0 && !user?.stripe_subscription_id ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--accent3)' }}>
                      ✨ Deluxe Trial Active
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                      Expires in <strong style={{ color: 'var(--text)' }}>{trialDays} day{trialDays !== 1 ? 's' : ''}</strong>
                      {user?.trial_ends_at && (
                        <> ({new Date(user.trial_ends_at).toLocaleDateString('en-MY', { day:'numeric', month:'long', year:'numeric' })})</>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: 'var(--accent3)' }}>{trialDays}</div>
                    <div className="text-xs" style={{ color: 'var(--text3)' }}>days left</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text3)' }}>
                    <span>Trial progress</span>
                    <span>{30 - trialDays}/30 days used</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'var(--surface2)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${((30 - trialDays) / 30) * 100}%`,
                        background: trialDays <= 3
                          ? 'var(--red)'
                          : 'linear-gradient(90deg,var(--accent),var(--accent2))',
                      }} />
                  </div>
                </div>

                <Link href="/settings/billing" className="btn-primary w-full justify-center">
                  Upgrade Now — Keep All Features
                </Link>
              </div>
            ) : user?.stripe_subscription_id ? (
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>
                  ✓ Active Subscription
                </p>
                <Link href="/settings/billing" className="btn-secondary text-xs py-1.5 px-3">
                  Manage
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm" style={{ color: 'var(--text2)' }}>
                  You are on the <strong style={{ color: 'var(--text)' }}>Free</strong> plan.
                  Upgrade to unlock CSV export, advanced analytics, and more.
                </p>
                <Link href="/settings/billing" className="btn-primary w-full justify-center">
                  View Plans
                </Link>
              </div>
            )}
          </Section>

          {/* ── Password ── */}
          <Section title="Change Password" icon={Lock}>
            <form onSubmit={handleChangePw} className="space-y-4">
              {/* Current password */}
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showPw.current ? 'text' : 'password'} className="input pr-11"
                    placeholder="Enter current password"
                    value={pw.current}
                    onChange={e => setPw(p => ({ ...p, current: noSpaces(e.target.value) }))}
                    required />
                  <button type="button" onClick={() => setShowPw(s => ({...s, current: !s.current}))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text3)' }}>
                    {showPw.current ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showPw.new ? 'text' : 'password'} className="input pr-11"
                    placeholder="Create strong password"
                    value={pw.new}
                    onChange={e => setPw(p => ({ ...p, new: noSpaces(e.target.value) }))}
                    required />
                  <button type="button" onClick={() => setShowPw(s => ({...s, new: !s.new}))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg"
                    style={{ color: 'var(--text3)' }}>
                    {showPw.new ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>

                {/* Strength meter */}
                {pw.new && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--surface3)' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(passed/PW_CHECKS.length)*100}%`, background: colors[passed-1]||'transparent' }} />
                      </div>
                      <span className="text-xs font-bold w-20 text-right"
                        style={{ color: colors[passed-1]||'var(--text3)' }}>
                        {labels[passed-1]||'Too Weak'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {PW_CHECKS.map(c => {
                        const ok = c.test(pw.new);
                        return (
                          <div key={c.label} className="flex items-center gap-2">
                            {ok
                              ? <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
                              : <Circle      size={12} style={{ color: 'var(--text3)', flexShrink: 0 }} />}
                            <span className="text-xs" style={{ color: ok ? 'var(--green)' : 'var(--text2)' }}>
                              {c.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="label">Confirm New Password</label>
                <input type="password" className="input"
                  placeholder="Re-enter new password"
                  value={pw.confirm}
                  onChange={e => setPw(p => ({ ...p, confirm: noSpaces(e.target.value) }))}
                  required />
                {pw.confirm && pw.new !== pw.confirm && (
                  <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>Passwords do not match.</p>
                )}
              </div>

              <button type="submit" disabled={saving || !isStrong} className="btn-primary">
                <Lock size={14} />
                {saving ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </Section>

          {/* ── Currency ── */}
          <Section title="Display Currency" icon={Globe}>
            <div className="space-y-3">
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                All prices shown in your selected currency. Rates update daily.
                {rateDate && rateDate !== 'offline' && (
                  <span style={{ color: 'var(--text3)' }}> Last updated: {rateDate}</span>
                )}
                {rateDate === 'offline' && (
                  <span style={{ color: 'var(--orange)' }}> Using offline rates.</span>
                )}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {CURRENCIES.map(({ code, label, symbol, flag }) => {
                  const active = currency === code;
                  return (
                    <button key={code}
                      onClick={() => { switchCurrency(code); toast.success(`Currency: ${code}`); }}
                      className="flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: active ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
                        border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      }}>
                      <span className="text-2xl">{flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                          {symbol} {code}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text2)' }}>{label}</p>
                      </div>
                      {active && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--accent)' }}>
                          <span className="text-white text-xs font-black">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                <RefreshCw size={12} />
                Exchange rates auto-update daily from exchangerate-api.com
              </div>
            </div>
          </Section>

        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
