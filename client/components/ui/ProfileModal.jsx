import { useState } from 'react';
import { X, Lock, Sparkles, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';
import { useCurrency } from '../../contexts/CurrencyContext';

const PLANS = {
  deluxe:  { label: 'DELUXE',  bg: 'rgba(99,102,241,0.15)',  color: 'var(--accent3)' },
  premium: { label: 'PREMIUM', bg: 'rgba(168,85,247,0.15)', color: 'var(--purple)' },
  starter: { label: 'STARTER', bg: 'rgba(34,197,94,0.15)',  color: 'var(--green)' },
  free:    { label: 'FREE',    bg: 'rgba(148,163,184,0.15)', color: 'var(--text2)' },
};

const CURRENCIES = [
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'USD', label: 'US Dollar',         symbol: '$',  flag: '🇺🇸' },
];

export default function ProfileModal({ user, onClose }) {
  const { currency, switchCurrency } = useCurrency();
  const [tab,    setTab]    = useState('profile');
  const [pw,     setPw]     = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) { toast.error('Passwords do not match.'); return; }
    if (pw.newPassword.length < 8)     { toast.error('Min. 8 characters required.'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password updated!');
      setPw({ currentPassword:'', newPassword:'', confirm:'' });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const plan = PLANS[user?.plan] || PLANS.free;
  const trialDays = user?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
        onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface3)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-bold" style={{ color: 'var(--text)' }}>Account Settings</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-xl"><X size={15} /></button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3">
          <div className="segment-control">
            {[['profile','Profile'],['password','Password'],['currency','Currency']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('segment-btn', tab === t && 'active')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-6">

          {/* ── Profile tab ── */}
          {tab === 'profile' && (
            <div className="space-y-3 animate-fade-in">
              {/* Avatar card */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{user?.name}</p>
                  <p className="text-sm mb-1.5" style={{ color: 'var(--text2)' }}>{user?.email}</p>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={{ background: plan.bg, color: plan.color }}>
                    {plan.label}
                  </span>
                </div>
              </div>

              {/* Trial countdown */}
              {trialDays !== null && trialDays > 0 && !user?.stripe_subscription_id && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: 'var(--accent3)' }}>
                      {trialDays} day{trialDays !== 1 ? 's' : ''} left in trial
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text2)' }}>Upgrade to keep all features</p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--accent3)' }} />
                </div>
              )}

              {/* Locked notice */}
              {user?.is_locked && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Lock size={16} style={{ color: 'var(--red)', flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--red)' }}>Account Locked</p>
                    <p className="text-xs" style={{ color: 'var(--text2)' }}>
                      Your data is safe. Renew to restore access.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Password tab ── */}
          {tab === 'password' && (
            <form onSubmit={handleChangePw} className="space-y-3 animate-fade-in">
              {[
                ['currentPassword', 'Current Password',  'Enter current password'],
                ['newPassword',     'New Password',       'Min. 8 characters'],
                ['confirm',         'Confirm Password',   'Re-enter new password'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input type="password" className="input" placeholder={placeholder}
                    value={pw[name]} onChange={e => setPw(p => ({ ...p, [name]: e.target.value }))} required />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
                <Lock size={14} />
                {saving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          )}

          {/* ── Currency tab ── */}
          {tab === 'currency' && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs mb-3" style={{ color: 'var(--text2)' }}>
                All prices will be displayed in your selected currency. Exchange rates are approximate.
              </p>
              {CURRENCIES.map(({ code, label, symbol, flag }) => {
                const active = currency === code;
                return (
                  <button key={code} onClick={() => { switchCurrency(code); toast.success(`Currency changed to ${code}`); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-150 text-left"
                    style={{
                      background: active ? 'rgba(99,102,241,0.1)' : 'var(--surface2)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    }}>
                    <span className="text-2xl">{flag}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                        {symbol} — {code}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text2)' }}>{label}</p>
                    </div>
                    {active && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--accent)' }}>
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                );
              })}
              <div className="p-3 rounded-xl text-xs" style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                💡 Rate: 1 MYR ≈ 0.21 USD (approximate)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
