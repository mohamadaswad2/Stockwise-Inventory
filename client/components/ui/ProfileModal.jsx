import { useState } from 'react';
import { X, Shield, Lock, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import * as authService from '../../services/auth.service';

export default function ProfileModal({ user, onClose }) {
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

  const planStyle = {
    deluxe:  { label: 'DELUXE',  bg: 'rgba(99,102,241,0.15)', color: 'var(--accent3)' },
    premium: { label: 'PREMIUM', bg: 'rgba(168,85,247,0.15)', color: 'var(--purple)' },
    starter: { label: 'STARTER', bg: 'rgba(34,197,94,0.15)',  color: 'var(--green)' },
    free:    { label: 'FREE',    bg: 'rgba(148,163,184,0.15)', color: 'var(--text2)' },
  };
  const plan = planStyle[user?.plan] || planStyle.free;

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
          <h2 className="font-bold" style={{ color: 'var(--text)' }}>Account</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-xl"><X size={15} /></button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3">
          <div className="segment-control">
            {[['profile','Profile'],['password','Password']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)}
                className={clsx('segment-btn', tab === t && 'active')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 pb-6">
          {tab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              {/* Avatar + info */}
              <div className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text)' }}>{user?.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>{user?.email}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: plan.bg, color: plan.color }}>
                      {plan.label}
                    </span>
                    {user?.is_locked && (
                      <span className="badge badge-red text-xs">Locked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trial countdown */}
              {trialDays !== null && trialDays > 0 && !user?.stripe_subscription_id && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <Sparkles size={16} style={{ color: 'var(--accent3)', flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--accent3)' }}>
                      Trial expires in {trialDays} day{trialDays !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>
                      Upgrade to keep all features
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}
