import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import clsx from 'clsx';
import {
  LayoutDashboard, Package, BarChart2, TrendingUp,
  LogOut, Menu, X, Sun, Moon, ChevronRight, ShieldAlert, Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import TrialBanner from '../ui/TrialBanner';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inventory',  label: 'Inventory',  icon: Package },
  { href: '/sales',      label: 'Sales',       icon: BarChart2 },
  { href: '/analytics',  label: 'Analytics',   icon: TrendingUp },
];

function NavLink({ href, label, icon: Icon, active, onClick }) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
      style={{
        background: active ? 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.12))' : 'transparent',
        color: active ? 'var(--accent3)' : 'var(--text2)',
        border: active ? '1px solid rgba(99,102,241,0.18)' : '1px solid transparent',
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
  const [sideOpen, setSideOpen] = useState(false);

  const isAdmin   = user?.role === 'admin';
  const pageTitle = NAV.find(n => router.pathname.startsWith(n.href))?.label
    ?? (router.pathname.startsWith('/admin')    ? 'Admin Panel'
    :   router.pathname.startsWith('/settings') ? 'Settings'
    :   'StockWise');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {sideOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSideOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 transition-transform duration-300',
        sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

        {/* Brand */}
        <div className="flex items-center gap-3 px-4 h-14 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))', boxShadow: '0 0 16px var(--glow)' }}>
            SW
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>StockWise</p>
            <p className="text-xs capitalize truncate" style={{ color: 'var(--text3)' }}>{user?.plan} plan</p>
          </div>
          <button className="ml-auto lg:hidden btn-ghost p-1 flex-shrink-0" onClick={() => setSideOpen(false)}>
            <X size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="section-title px-3 mb-3">Menu</p>
          {NAV.map(({ href, label, icon }) => (
            <NavLink key={href} href={href} label={label} icon={icon}
              active={router.pathname.startsWith(href)}
              onClick={() => setSideOpen(false)} />
          ))}

          {isAdmin && (
            <>
              <div className="glow-divider my-3 mx-3" />
              <p className="section-title px-3 mb-2">Admin</p>
              <NavLink href="/admin" label="Admin Panel" icon={ShieldAlert}
                active={router.pathname.startsWith('/admin')}
                onClick={() => setSideOpen(false)} />
            </>
          )}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid var(--border)' }}>
          <button onClick={toggle}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--text2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--text2)'; }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>

          <NavLink href="/settings" label="Settings" icon={Settings}
            active={router.pathname.startsWith('/settings')}
            onClick={() => setSideOpen(false)} />

          <button onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: 'var(--red)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = ''}>
            <LogOut size={15} /> Sign Out
          </button>

          {/* User chip */}
          <Link href="/settings"
            className="flex items-center gap-2.5 px-3 pt-3 mt-1"
            style={{ borderTop: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{user?.email}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="glass h-14 flex items-center px-4 gap-3 flex-shrink-0 z-20 sticky top-0">
          <button className="lg:hidden btn-icon w-8 h-8 rounded-lg flex-shrink-0" onClick={() => setSideOpen(true)}>
            <Menu size={17} />
          </button>
          <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{pageTitle}</h1>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <button onClick={toggle} className="btn-icon w-8 h-8 rounded-lg">
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link href="/settings"
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent2))' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Link>
          </div>
        </header>

        <TrialBanner user={user} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
