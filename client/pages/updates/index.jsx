import { useEffect, useState } from 'react';
import Head from 'next/head';
import { Megaphone, Zap, Wrench, Star, ChevronDown } from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import Spinner from '../../components/ui/Spinner';
import { getUpdates, likeUpdate } from '../../services/updates.service';

const TYPE_CONFIG = {
  feature:      { label: 'New Feature',    icon: Star,      bg: 'rgba(99,102,241,0.12)',  color: 'var(--accent3)' },
  update:       { label: 'Update',         icon: Zap,       bg: 'rgba(34,197,94,0.12)',   color: 'var(--green)' },
  fix:          { label: 'Bug Fix',        icon: Wrench,    bg: 'rgba(245,158,11,0.12)',  color: 'var(--orange)' },
  announcement: { label: 'Announcement',   icon: Megaphone, bg: 'rgba(168,85,247,0.12)', color: 'var(--purple)' },
};

function UpdateCard({ update, onLike }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[update.type] || TYPE_CONFIG.update;
  const Icon = cfg.icon;
  const date = new Date(update.created_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  // Show first 120 chars as preview
  const preview   = update.content.slice(0, 120);
  const hasMore   = update.content.length > 120;
  const displayed = expanded ? update.content : preview + (hasMore ? '…' : '');

  return (
    <div className="card overflow-hidden transition-all duration-200"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: cfg.bg }}>
            <Icon size={16} style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: cfg.bg, color: cfg.color }}>
                {cfg.label}
              </span>
              {update.version && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                  style={{ background: 'var(--surface2)', color: 'var(--text3)' }}>
                  v{update.version}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text3)' }}>{date}</span>
            </div>
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {update.title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap pl-12"
          style={{ color: 'var(--text2)' }}>
          {displayed}
        </p>

        {hasMore && (
          <button onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1 mt-2 pl-12 text-xs font-semibold transition-all"
            style={{ color: 'var(--accent3)' }}>
            {expanded ? 'Show less' : 'Read more'}
            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        )}

        {/* Like button */}
        <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:10 }}>
          <button onClick={() => onLike?.(update.id)}
            style={{
              display:'inline-flex', alignItems:'center', gap:5,
              padding:'5px 12px', borderRadius:99, fontSize:12, fontWeight:600,
              background:'var(--surface2)', color:'var(--text3)',
              border:'1px solid var(--border)', cursor:'pointer', transition:'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background='var(--red-bg)'; e.currentTarget.style.color='var(--red)'; e.currentTarget.style.borderColor='rgba(242,85,90,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='var(--border)'; }}>
            ❤️ {update.likes || 0}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UpdatesPage() {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total,   setTotal]   = useState(0);

  const handleLike = async (id) => {
    try {
      const res = await likeUpdate(id);
      setUpdates(prev => prev.map(u =>
        u.id === id ? { ...u, likes: res.data.data.likes } : u
      ));
    } catch {}
  };

  useEffect(() => {
    getUpdates({ limit: 20 })
      .then(r => {
        setUpdates(r.data.data.updates || []);
        setTotal(r.data.data.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>App Updates — StockWise</title></Head>

        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}>
              <Megaphone size={18} style={{ color: 'var(--accent3)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>App Updates</h1>
          </div>
          <p className="text-sm ml-12" style={{ color: 'var(--text2)' }}>
            Latest features, fixes and announcements
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Spinner size="lg" /></div>
        ) : updates.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--surface2)' }}>
              <Megaphone size={28} style={{ color: 'var(--text3)' }} />
            </div>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>No updates yet</p>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>
              Check back soon for new features and improvements.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-2xl animate-fade-in">
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mb-2">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <span key={key} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                );
              })}
            </div>

            {updates.map(u => <UpdateCard key={u.id} update={u} onLike={handleLike} />)}

            {total > updates.length && (
              <p className="text-xs text-center py-4" style={{ color: 'var(--text3)' }}>
                Showing {updates.length} of {total} updates
              </p>
            )}
          </div>
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
