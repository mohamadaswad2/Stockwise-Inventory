export default function StatCard({ icon: Icon, label, value, sub, color = 'blue' }) {
  const colors = {
    blue:   { bg: 'rgba(0,122,255,0.1)',   text: 'var(--ios-blue)' },
    green:  { bg: 'rgba(52,199,89,0.1)',   text: 'var(--ios-green)' },
    orange: { bg: 'rgba(255,149,0,0.1)',   text: 'var(--ios-orange)' },
    red:    { bg: 'rgba(255,59,48,0.1)',   text: 'var(--ios-red)' },
    purple: { bg: 'rgba(175,82,222,0.1)',  text: 'var(--ios-purple)' },
  };
  const c = colors[color] || colors.blue;

  return (
    <div className="card p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: c.bg }}>
        <Icon size={18} style={{ color: c.text }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--ios-text2)' }}>{label}</p>
        <p className="text-2xl font-bold leading-none" style={{ color: 'var(--ios-text)' }}>{value ?? '—'}</p>
        {sub && <p className="text-xs mt-1" style={{ color: 'var(--ios-text2)' }}>{sub}</p>}
      </div>
    </div>
  );
}