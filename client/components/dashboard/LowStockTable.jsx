/**
 * LowStockTable — shows items that are at or below their reorder threshold.
 */
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function LowStockTable({ items = [] }) {
  if (!items.length) {
    return (
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" /> Low Stock Alerts
        </h2>
        <p className="text-sm text-slate-400 text-center py-6">All items are well-stocked ✓</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          Low Stock Alerts
          <span className="badge-yellow">{items.length}</span>
        </h2>
        <Link href="/inventory?low_stock=true" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const isOut = item.quantity === 0;
          return (
            <div key={item.id} className="flex items-center px-5 py-3 gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                <p className="text-xs text-slate-400">{item.sku || 'No SKU'}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={clsx('badge', isOut ? 'badge-red' : 'badge-yellow')}>
                  {item.quantity} {item.unit}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">threshold: {item.low_stock_threshold}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
