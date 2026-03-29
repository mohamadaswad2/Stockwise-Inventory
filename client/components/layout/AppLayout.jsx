import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  LayoutDashboard, Package, BarChart2, LogOut,
  Menu, X, Sun, Moon, ChevronRight, ShieldAlert, Settings,
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

function NavItem({ href, label, icon: Icon, active, onClick }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
      style={{
        background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))' : 'transparent',
        color: active ? 'var(--accent3)' : 'var(--text2)',
        border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }}}>
      <Icon size={16} />
      <span>{label}</span>
      {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
    </Link>
  );
}

export default function AppLayout({ children }) {
  const { user, logout }   = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const [sideOpen,    setSideOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const pageTitle = NAV.find(n => router.pathname.startsWith(n.href))?.label
    ?? (router.pathname.startsWith('/admin') ? 'Admin Panel' : 'StockWise');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSideOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300',
        sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', boxShadow: '0 0 16px var(--glow)' }}>
            SW
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>StockWise</p>
            <p className="text-xs capitalize" style={{ color: 'var(--text3)' }}>{user?.plan} plan</p>
          </div>
          <button className="ml-auto lg:hidden btn-ghost p-1" onClick={() => setSideOpen(false)}>
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-title px-3 mb-3">Menu</p>
          {NAV.map(({ href, label, icon }) => (
            <NavItem key={href} href={href} label={label} icon={icon}
              active={router.pathname.startsWith(href)}
              onClick={() => setSideOpen(false)} />
          ))}

          {isAdmin && (
            <>
              <div className="glow-divider my-3 mx-3" />
              <p className="section-title px-3 mb-2">Admin</p>
              <NavItem href="/admin" label="Admin Panel" icon={ShieldAlert}
                active={router.pathname.startsWith('/admin')}
                onClick={() => setSideOpen(false)} />
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text2)'; }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button onClick={() => { setProfileOpen(true); setSideOpen(false); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--text2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text2)'; }}>
            <Settings size={15} />
            Settings
          </button>

          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={{ color: 'var(--red)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <LogOut size={15} />
            Sign Out
          </button>

          {/* User chip */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-xl cursor-pointer"
            style={{ borderTop: '1px solid var(--border)', marginTop: '8px', paddingTop: '12px' }}
            onClick={() => setProfileOpen(true)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="glass h-14 flex items-center px-5 gap-4 flex-shrink-0 z-20 sticky top-0">
          <button className="lg:hidden btn-icon w-8 h-8 rounded-lg" onClick={() => setSideOpen(true)}>
            <Menu size={17} />
          </button>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="btn-icon w-8 h-8 rounded-lg">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button onClick={() => setProfileOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
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
