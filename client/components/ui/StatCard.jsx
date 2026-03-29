export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const palette = {
    blue:   { bg: 'rgba(99,102,241,0.12)',  color: 'var(--accent3)' },
    green:  { bg: 'rgba(34,197,94,0.12)',   color: 'var(--green)' },
    orange: { bg: 'rgba(245,158,11,0.12)',  color: 'var(--orange)' },
    red:    { bg: 'rgba(239,68,68,0.12)',   color: 'var(--red)' },
    purple: { bg: 'rgba(168,85,247,0.12)',  color: 'var(--purple)' },
  };
  const p = palette[color] || palette.blue;

  return (
    <div className="card p-4 flex items-start gap-3 transition-all duration-200"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: p.bg }}>
        <Icon size={18} style={{ color: p.color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider mb-1"
          style={{ color: 'var(--text3)' }}>{label}</p>
        <p className="text-2xl font-bold leading-none tabular-nums"
          style={{ color: 'var(--text)' }}>{value ?? '—'}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--text2)' }}>{sub}</p>}
      </div>
    </div>
  );
}
