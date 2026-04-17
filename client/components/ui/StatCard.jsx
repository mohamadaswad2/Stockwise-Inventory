import { useState } from 'react';
import MetricTooltip from './MetricTooltip';

export default function StatCard({ icon: Icon, label, value, sub, color = 'blue', tooltip }) {
  const palette = {
    blue:   { bg: 'var(--accent-bg)',  color: 'var(--accent3)' },
    green:  { bg: 'var(--green-bg)',   color: 'var(--green)' },
    orange: { bg: 'var(--orange-bg)',  color: 'var(--orange)' },
    red:    { bg: 'var(--red-bg)',     color: 'var(--red)' },
    purple: { bg: 'var(--purple-bg)',  color: 'var(--purple)' },
  };
  const p = palette[color] || palette.blue;

  return (
    <div className="stat-card card-hover"
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div className="stat-icon" style={{ background: p.bg }}>
        <Icon size={17} style={{ color: p.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
          <p className="stat-label">{label}</p>
          {tooltip && <MetricTooltip description={tooltip} />}
        </div>
        <p className="stat-value">{value ?? '—'}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{sub}</p>}
      </div>
    </div>
  );
}
