import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  LayoutDashboard, Package, LogOut, Menu, X,
  Sun, Moon, ChevronRight, ShieldAlert,
  Settings, BarChart2, Tag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import TrialBanner from '../ui/TrialBanner';
import ProfileModal from '../ui/ProfileModal';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory',  label: 'Inventory',  icon: Package },
  { href: '/sales',      label: 'Sales',       icon: BarChart2 },
];

export default function AppLayout({ children }) {
  const { user, logout }   = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const [sideOpen,     setSideOpen]     = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--ios-bg)' }}>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSideOpen(false)} />
      )}

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300',
        sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: 'var(--ios-surface)', borderRight: '1px solid var(--ios-separator)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16"
          style={{ borderBottom: '1px solid var(--ios-separator)' }}>
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-white text-sm font-bold shadow-ios-glow"
            style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>
            SW
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--ios-text)' }}>StockWise</p>
            <p className="text-xs" style={{ color: 'var(--ios-text2)' }}>{user?.plan} plan</p>
          </div>
          <button className="ml-auto lg:hidden btn-ghost" onClick={() => setSideOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-title px-3 mb-3">MENU</p>
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setSideOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150',
                  active ? 'text-white shadow-ios' : ''
                )}
                style={active
                  ? { background: 'var(--ios-blue)' }
                  : { color: 'var(--ios-text2)' }
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--ios-surface2)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = ''; }}>
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <p className="section-title px-3 mt-5 mb-3">ADMIN</p>
              <Link href="/admin" onClick={() => setSideOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150',
                  router.pathname.startsWith('/admin') ? 'text-white' : ''
                )}
                style={router.pathname.startsWith('/admin')
                  ? { background: 'var(--ios-purple)' }
                  : { color: 'var(--ios-text2)' }}
                onMouseEnter={e => { if (!router.pathname.startsWith('/admin')) e.currentTarget.style.background = 'var(--ios-surface2)'; }}
                onMouseLeave={e => { if (!router.pathname.startsWith('/admin')) e.currentTarget.style.background = ''; }}>
                <ShieldAlert size={17} />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 space-y-0.5" style={{ borderTop: '1px solid var(--ios-separator)' }}>
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--ios-text2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ios-surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={() => { setProfileOpen(true); setSideOpen(false); }}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--ios-text2)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--ios-surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <Settings size={16} />
            Settings
          </button>

          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--ios-red)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <LogOut size={16} />
            Sign Out
          </button>

          {/* Avatar chip */}
          <div className="flex items-center gap-3 px-3 pt-2 mt-1">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--ios-text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--ios-text2)' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* iOS-style blurred topbar */}
        <header className="glass h-16 flex items-center px-5 gap-4 flex-shrink-0 z-20">
          <button className="lg:hidden btn-icon" onClick={() => setSideOpen(true)}>
            <Menu size={18} />
          </button>
          <h1 className="text-base font-semibold" style={{ color: 'var(--ios-text)' }}>
            {NAV.find(n => router.pathname.startsWith(n.href))?.label ?? 'StockWise'}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="btn-icon">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={() => setProfileOpen(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#007aff,#5856d6)' }}>
              {user?.name?.[0]?.toUpperCase()}
            </button>
          </div>
        </header>

        <TrialBanner user={user} />

        <main className="flex-1 overflow-y-auto p-5 animate-fade-in">
          {children}
        </main>
      </div>

      {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} />}
    </div>
  );
}
