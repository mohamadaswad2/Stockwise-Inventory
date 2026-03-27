import { useState } from 'react';
import { X, User, Lock, ChevronRight } from 'lucide-react';
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
    if (pw.newPassword.length < 8)     { toast.error('Min. 8 characters.'); return; }
    setSaving(true);
    try {
      await authService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally { setSaving(false); }
  };

  const planColor = { deluxe: 'badge-blue', premium: 'badge-purple', starter: 'badge-green', free: 'badge-yellow' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--ios-surface)' }}>

        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--ios-separator)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--ios-separator)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>Account</h2>
          <button onClick={onClose} className="btn-icon"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-3">
          <div className="segment-control">
            {[['profile','Profile'],['password','Password']].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} className={clsx('segment-btn', tab===t&&'active')}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-6">
          {tab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: 'var(--ios-surface2)' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--ios-text)' }}>{user?.name}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--ios-text2)' }}>{user?.email}</p>
                  <span className={clsx('badge', planColor[user?.plan] || 'badge-blue')}>
                    {user?.plan?.toUpperCase()}
                  </span>
                </div>
              </div>

              {user?.trial_ends_at && !user?.stripe_subscription_id && (() => {
                const days = Math.ceil((new Date(user.trial_ends_at) - new Date()) / 86400000);
                return days > 0 ? (
                  <div className="p-3 rounded-2xl" style={{ background: 'rgba(0,122,255,0.08)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--ios-blue)' }}>
                      ✨ Trial ends in <strong>{days} day{days !== 1 ? 's' : ''}</strong>
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {tab === 'password' && (
            <form onSubmit={handleChangePw} className="space-y-3 animate-fade-in">
              {[
                ['currentPassword','Current Password','Enter current password'],
                ['newPassword',    'New Password',     'Min. 8 characters'],
                ['confirm',        'Confirm Password', 'Re-enter new password'],
              ].map(([name, label, placeholder]) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input type="password" className="input" placeholder={placeholder}
                    value={pw[name]} onChange={e => setPw(p => ({...p,[name]:e.target.value}))} required />
                </div>
              ))}
              <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
                {saving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
