import { useState } from 'react';
import clsx from 'clsx';
import { Pencil, Trash2, ArrowLeftRight, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import Spinner from '../ui/Spinner';

function StockBadge({ qty, threshold }) {
  if (qty === 0)        return <span className="badge badge-red">Out of stock</span>;
  if (qty <= threshold) return <span className="badge badge-yellow">Low stock</span>;
  return <span className="badge badge-green">In stock</span>;
}

export default function ItemTable({ items, total, loading, filters, setFilters, onEdit, onDelete, onTransaction }) {
  const [delItem,    setDelItem]    = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const totalPages = Math.ceil(total / (filters.limit || 20));

  const confirmDelete = async () => {
    setDelLoading(true);
    try { await onDelete(delItem.id); }
    finally { setDelLoading(false); setDelItem(null); }
  };

  if (loading) return (
    <div className="card flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );

  if (!items.length) return (
    <div className="card flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
        style={{ background: 'var(--ios-surface2)' }}>
        <Package size={28} style={{ color: 'var(--ios-text3)' }} />
      </div>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ios-text)' }}>No items found</p>
      <p className="text-sm" style={{ color: 'var(--ios-text2)' }}>Add your first inventory item to get started.</p>
    </div>
  );

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ios-separator)', background: 'var(--ios-surface2)' }}>
                {['Item','SKU','Category','Stock','Price','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                    style={{ color: 'var(--ios-text2)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="transition-colors duration-100"
                  style={{ borderBottom: '1px solid var(--ios-separator)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--ios-surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ios-text)' }}>{item.name}</p>
                    {item.description && <p className="text-xs truncate" style={{ color: 'var(--ios-text2)' }}>{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--ios-surface2)', color: 'var(--ios-text2)' }}>
                      {item.sku || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm" style={{ color: 'var(--ios-text2)' }}>
                    {item.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold" style={{ color: 'var(--ios-text)' }}>{item.quantity}</span>
                    <span className="text-xs ml-1" style={{ color: 'var(--ios-text2)' }}>{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-semibold" style={{ color: 'var(--ios-text)' }}>
                    RM {Number(item.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StockBadge qty={item.quantity} threshold={item.low_stock_threshold} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onTransaction?.(item)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
                        style={{ color: 'var(--ios-blue)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        title="Record transaction">
                        <ArrowLeftRight size={14} />
                      </button>
                      <button onClick={() => onEdit(item)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
                        style={{ color: 'var(--ios-text2)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--ios-surface2)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDelItem(item)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150"
                        style={{ color: 'var(--ios-red)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--ios-separator)' }}>
            <p className="text-xs" style={{ color: 'var(--ios-text2)' }}>
              {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon w-8 h-8 rounded-xl" disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn-icon w-8 h-8 rounded-xl" disabled={filters.page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!delItem} onClose={() => setDelItem(null)}
        onConfirm={confirmDelete} loading={delLoading}
        title="Delete item?"
        description={`"${delItem?.name}" will be removed from your inventory.`}
      />
    </>
  );
}
