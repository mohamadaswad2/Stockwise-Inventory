import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function LowStockTable({ items = [] }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <AlertTriangle size={15} style={{ color: 'var(--orange)' }} />
          Low Stock Alerts
          {items.length > 0 && (
            <span className="badge badge-yellow">{items.length}</span>
          )}
        </h3>
        <Link href="/inventory?low_stock=true"
          className="text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent3)' }}>
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-sm" style={{ color: 'var(--text3)' }}>All items are well-stocked ✓</p>
        </div>
      ) : (
        <div>
          {items.map(item => (
            <div key={item.id} className="list-row">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{item.sku || 'No SKU'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={item.quantity === 0 ? 'badge badge-red' : 'badge badge-yellow'}>
                  {item.quantity} {item.unit}
                </span>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>
                  min: {item.low_stock_threshold}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
