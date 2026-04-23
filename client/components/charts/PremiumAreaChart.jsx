/**
 * PremiumAreaChart — global premium chart component
 *
 * NEGATIVE / REFUND DATA HANDLING:
 *   computeDomain() caps the negative floor at max -30% of positive max.
 *   A small refund never makes the chart visually catastrophic.
 *   ReferenceLine at y=0 gives clear zero context.
 *   Tooltip shows "↩ incl. refund" badge when any value is negative.
 *
 * USAGE:
 *   <PremiumAreaChart
 *     data={trendData}
 *     series={[
 *       { key: 'revenue', name: 'Revenue', color: 'var(--green)'   },
 *       { key: 'profit',  name: 'Profit',  color: 'var(--accent3)' },
 *       { key: 'cost',    name: 'Cost',    color: 'var(--orange)'  },
 *     ]}
 *     formatY={v => format(v)}
 *     height={220}
 *     loading={false}
 *     chartKey="unique-id"
 *   />
 */
import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, ReferenceLine,
} from 'recharts';

/* ─── Shimmer skeleton ──────────────────────────────────────────────────────── */
export function ChartSkeleton({ height = 200 }) {
  return (
    <div style={{ height, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
      }} />
      {/* Fake grid lines */}
      {[0.22, 0.44, 0.66, 0.88].map(p => (
        <div key={p} style={{
          position: 'absolute', left: 52, right: 4, bottom: `${p * 100}%`,
          height: 1, background: 'var(--border)', opacity: 0.4,
        }} />
      ))}
      {/* Fake y-axis labels */}
      {[0.22, 0.44, 0.66, 0.88].map(p => (
        <div key={`l${p}`} style={{
          position: 'absolute', left: 4, bottom: `calc(${p * 100}% - 6px)`,
          width: 40, height: 10, borderRadius: 4,
          background: 'var(--surface3)', opacity: 0.7,
        }} />
      ))}
    </div>
  );
}

/* ─── Smart Y-axis domain ───────────────────────────────────────────────────── */
function computeDomain(data, keys) {
  if (!data?.length) return [0, 10];

  let minVal = Infinity;
  let maxVal = -Infinity;

  data.forEach(row => {
    keys.forEach(k => {
      const v = Number(row[k] ?? 0);
      if (v < minVal) minVal = v;
      if (v > maxVal) maxVal = v;
    });
  });

  // All-zero dataset — show flat baseline
  if (minVal === 0 && maxVal === 0) return [0, 10];

  const range = maxVal - minVal || 1;
  const pad   = range * 0.18;

  if (minVal >= 0) {
    // All positive — anchor at 0, add breathing room above
    return [0, Math.ceil(maxVal + pad)];
  }

  // HAS NEGATIVES — the key fix:
  // Cap floor so small refunds don't dominate the visual.
  // Negative floor = max of (actual min, -30% of positive max).
  // This means: a -RM10 refund on a RM500 day never crashes the axis to -RM10.
  const cappedFloor = maxVal > 0
    ? Math.max(minVal, -(maxVal * 0.30))
    : minVal;

  return [
    Math.floor(cappedFloor - Math.abs(cappedFloor) * 0.12),
    Math.ceil(maxVal + pad),
  ];
}

/* ─── Tooltip ───────────────────────────────────────────────────────────────── */
function PremiumTooltip({ active, payload, label, formatY }) {
  if (!active || !payload?.length) return null;

  const hasNegative = payload.some(p => Number(p.value) < 0);

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: 12,
      padding: '10px 14px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      minWidth: 150,
    }}>
      {/* Label */}
      <p style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 9,
      }}>
        {label}
      </p>

      {/* Series */}
      {payload.map(p => {
        const val    = Number(p.value);
        const isNeg  = val < 0;
        const dispColor = isNeg ? 'var(--red)' : p.color;
        return (
          <div key={p.dataKey} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', gap: 16, marginBottom: 5,
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text2)' }}>
              {/* Line swatch */}
              <span style={{
                width: 14, height: 2, borderRadius: 99,
                background: p.color, flexShrink: 0,
                boxShadow: `0 0 4px ${p.color}70`,
              }} />
              {p.name}
            </span>
            <span style={{
              fontWeight: 700, fontSize: 12, color: dispColor,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatY ? formatY(val) : val}
            </span>
          </div>
        );
      })}

      {/* Refund badge */}
      {hasNegative && (
        <div style={{
          marginTop: 7, padding: '3px 8px', borderRadius: 6,
          background: 'var(--red-bg)',
          border: '1px solid rgba(242,85,90,0.22)',
          fontSize: 10, fontWeight: 600, color: 'var(--red)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          ↩ includes refund
        </div>
      )}
    </div>
  );
}

/* ─── Legend ─────────────────────────────────────────────────────────────────── */
function PremiumLegend({ series }) {
  return (
    <div style={{
      display: 'flex', gap: 18, justifyContent: 'center',
      flexWrap: 'wrap', marginTop: 14,
    }}>
      {series.map(s => (
        <span key={s.key} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          fontSize: 11, color: 'var(--text2)', fontWeight: 500,
        }}>
          <span style={{
            width: 22, height: 2, borderRadius: 99,
            background: s.color, flexShrink: 0,
            boxShadow: `0 0 5px ${s.color}60`,
          }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

/* ─── Empty state ────────────────────────────────────────────────────────────── */
function EmptyState({ height }) {
  return (
    <div style={{
      height, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text3)' }}>
        No data for this period
      </p>
      <p style={{ fontSize: 11, color: 'var(--text3)', opacity: 0.6 }}>
        Data appears as you record sales
      </p>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────────── */
export default function PremiumAreaChart({
  data        = [],
  series      = [],     // [{ key, name, color }]  — ordered by visual priority
  formatY,              // Y tick + tooltip value formatter
  formatX,              // X tick formatter (optional override)
  height      = 210,
  loading     = false,
  chartKey    = 'chart',
  showLegend  = true,
  rightAxis   = null,   // optional { key, name, color } — drawn dashed on right Y
  emptyLabel,           // override empty state text
  className   = '',
  style       = {},
}) {
  const keys   = series.map(s => s.key);
  const domain = useMemo(() => computeDomain(data, keys), [data, keys.join(',')]);
  const hasNeg = domain[0] < 0;

  // Need >= 2 data points AND at least one non-zero value
  const hasData = data.length >= 2 && (
    data.some(row => keys.some(k => Math.abs(Number(row[k] ?? 0)) > 0)) ||
    (rightAxis && data.some(row => Math.abs(Number(row[rightAxis.key] ?? 0)) > 0))
  );

  // Unique gradient IDs — scoped to chartKey so multiple charts on same page don't clash
  const gid  = (key) => `g-${chartKey}-${key}`;

  if (loading) return <ChartSkeleton height={height} />;

  return (
    <div className={className} style={style}>
      <div style={{ height }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 6, right: rightAxis ? 30 : 4, left: 0, bottom: 0 }}
            >
              {/* ── Gradient defs ── */}
              <defs>
                {series.map(s => (
                  <linearGradient key={s.key} id={gid(s.key)} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={s.color} stopOpacity={0.18} />
                    <stop offset="60%"  stopColor={s.color} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.00} />
                  </linearGradient>
                ))}
                {rightAxis && (
                  <linearGradient id={gid(rightAxis.key)} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={rightAxis.color} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={rightAxis.color} stopOpacity={0.00} />
                  </linearGradient>
                )}
              </defs>

              {/* ── Grid ── */}
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="0"
                vertical={false}
                strokeOpacity={0.5}
              />

              {/* ── X Axis ── */}
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text3)', fontSize: 10, fontFamily: 'inherit' }}
                tickFormatter={formatX || (d => {
                  if (!d) return '';
                  const s = String(d);
                  if (s.includes(':')) return s;   // hourly "08:00"
                  return s.slice(5);               // daily  "03-15"
                })}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />

              {/* ── Primary Y Axis ── */}
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={domain}
                tick={{ fill: 'var(--text3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatY || (v => v)}
                width={50}
                tickMargin={4}
                tickCount={5}
              />

              {/* ── Right Y Axis (optional, e.g. stock units) ── */}
              {rightAxis && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: 'var(--text3)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={28}
                  tickMargin={4}
                />
              )}

              {/* ── Tooltip ── */}
              <Tooltip
                content={<PremiumTooltip formatY={formatY} />}
                cursor={{
                  stroke: 'var(--border2)',
                  strokeWidth: 1,
                  strokeDasharray: '4 3',
                }}
                animationDuration={100}
              />

              {/* ── Zero reference line (only when negatives exist) ── */}
              {hasNeg && (
                <ReferenceLine
                  yAxisId="left"
                  y={0}
                  stroke="var(--red)"
                  strokeOpacity={0.30}
                  strokeDasharray="5 4"
                  strokeWidth={1}
                />
              )}

              {/* ── Series — ordered by priority (revenue first = most prominent) ── */}
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  yAxisId="left"
                  type="monotoneX"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={i === 0 ? 2.0 : 1.6}   // Revenue line slightly thicker
                  fill={`url(#${gid(s.key)})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: s.color,
                    stroke: 'var(--surface)',
                    strokeWidth: 2,
                  }}
                  isAnimationActive={true}
                  animationDuration={600}
                  animationEasing="ease-in-out"
                  animationBegin={i * 80}
                />
              ))}

              {/* ── Right-axis series (dashed, subtle) ── */}
              {rightAxis && (
                <Area
                  yAxisId="right"
                  type="monotoneX"
                  dataKey={rightAxis.key}
                  name={rightAxis.name}
                  stroke={rightAxis.color}
                  strokeWidth={1.4}
                  strokeDasharray="5 3"
                  fill="none"
                  dot={false}
                  activeDot={{ r: 3, fill: rightAxis.color, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={700}
                  animationBegin={series.length * 80}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState height={height} />
        )}
      </div>

      {/* ── Legend ── */}
      {showLegend && hasData && (
        <PremiumLegend series={rightAxis ? [...series, rightAxis] : series} />
      )}
    </div>
  );
}
