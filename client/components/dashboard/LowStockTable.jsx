import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle, Package } from 'lucide-react';
import Spinner from '../ui/Spinner';

export default function LowStockTable({ items = [], loading }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '13px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--orange)' }} />
          Low Stock Alerts
          {items.length > 0 && (
            <span className="badge badge-yellow" style={{ fontSize: 10, padding: '2px 7px' }}>
              {items.length}
            </span>
          )}
        </h3>
        <Link href="/inventory?low_stock=true"
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent3)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Spinner />
        </div>
      ) : items.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={20} style={{ color: 'var(--green)' }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>All items well-stocked</p>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>No items below threshold</p>
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 16px',
              borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: item.quantity === 0 ? 'var(--red-bg)' : 'var(--orange-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={15} style={{ color: item.quantity === 0 ? 'var(--red)' : 'var(--orange)' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }} className="truncate">
                  {item.name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                  {item.sku || 'No SKU'}
                </p>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span className={item.quantity === 0 ? 'badge badge-red' : 'badge badge-yellow'}>
                  {item.quantity} {item.unit}
                </span>
                <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                  min {item.low_stock_threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
