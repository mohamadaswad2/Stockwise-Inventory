/**
 * CookieConsent — GDPR-friendly cookie consent banner.
 * Shows once, persists decision in localStorage.
 * Non-blocking — shows at bottom of screen.
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X, Shield } from 'lucide-react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it doesn't flash immediately on load
    const timer = setTimeout(() => {
      const decision = localStorage.getItem('sw-cookies');
      if (!decision) setVisible(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem('sw-cookies', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('sw-cookies', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-slide-up">
      <div className="card-glow p-4 shadow-xl"
        style={{ border: '1px solid var(--border2)' }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Cookie size={16} style={{ color: 'var(--accent3)' }} />
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              Cookie Notice
            </p>
          </div>
          <button onClick={decline}
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
            style={{ color: 'var(--text3)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text2)' }}>
          We use essential cookies to keep you logged in and remember your preferences
          (theme, currency). No tracking or advertising cookies.{' '}
          <Link href="/privacy" className="underline underline-offset-2 font-medium"
            style={{ color: 'var(--accent3)' }}>
            Privacy Policy
          </Link>
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={decline}
            className="flex-1 btn btn-secondary text-xs py-2">
            Decline
          </button>
          <button onClick={accept}
            className="flex-1 btn btn-primary text-xs py-2">
            <Shield size={12} />
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
