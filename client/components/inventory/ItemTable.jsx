import { useState } from 'react';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Package, ShoppingCart, PackagePlus } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import Spinner from '../ui/Spinner';
import { useCurrency } from '../../contexts/CurrencyContext';

function StockBadge({ qty, threshold }) {
  if (qty === 0)        return <span className="badge badge-red">Out of stock</span>;
  if (qty <= threshold) return <span className="badge badge-yellow">Low stock</span>;
  return <span className="badge badge-green">In stock</span>;
}

export default function ItemTable({
  items, total, loading, filters, setFilters,
  onEdit, onDelete, onQuickSell, onRestock
}) {
  const { format } = useCurrency();
  const [delItem,    setDelItem]    = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const totalPages = Math.ceil(total / (filters.limit || 20));

  const confirmDelete = async () => {
    setDelLoading(true);
    try { await onDelete(delItem.id); }
    finally { setDelLoading(false); setDelItem(null); }
  };

  if (loading) return (
    <div className="card flex items-center justify-center py-24"><Spinner size="lg" /></div>
  );

  if (!items.length) return (
    <div className="card flex flex-col items-center justify-center py-16 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--surface2)' }}>
        <Package size={28} style={{ color: 'var(--text3)' }} />
      </div>
      <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>No items found</p>
      <p className="text-sm" style={{ color: 'var(--text2)' }}>Add your first item to get started.</p>
    </div>
  );

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                {['Item','Category','Stock','Price','Cost','Margin','Status','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const price    = Number(item.price);
                const cost     = Number(item.cost_price || 0);
                const margin   = price > 0 ? (((price - cost) / price) * 100).toFixed(0) : 0;
                const isMarginGood = Number(margin) >= 20;

                return (
                  <tr key={item.id} className="transition-colors duration-100"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>

                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{item.name}</p>
                      {item.sku && (
                        <span className="text-xs font-mono" style={{ color: 'var(--text3)' }}>{item.sku}</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text2)' }}>
                      {item.category_name || '—'}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold tabular-nums" style={{ color: 'var(--text)' }}>{item.quantity}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text3)' }}>{item.unit}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums" style={{ color: 'var(--green)' }}>
                      {format(price)}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap font-semibold tabular-nums" style={{ color: 'var(--orange)' }}>
                      {cost > 0 ? format(cost) : <span style={{ color: 'var(--text3)' }}>—</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {cost > 0 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: isMarginGood ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                            color: isMarginGood ? 'var(--green)' : 'var(--orange)',
                          }}>
                          {margin}%
                        </span>
                      ) : <span style={{ color: 'var(--text3)', fontSize: '11px' }}>No cost</span>}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <StockBadge qty={item.quantity} threshold={item.low_stock_threshold} />
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {/* Sell */}
                        <button onClick={() => onQuickSell?.(item)}
                          disabled={item.quantity === 0}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Quick Sell"
                          style={{
                            background: item.quantity > 0 ? 'rgba(99,102,241,0.12)' : 'var(--surface3)',
                            color: item.quantity > 0 ? 'var(--accent3)' : 'var(--text3)',
                          }}>
                          <ShoppingCart size={12} /> Sell
                        </button>

                        {/* Restock */}
                        <button onClick={() => onRestock?.(item)}
                          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Restock"
                          style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}>
                          <PackagePlus size={12} /> Restock
                        </button>

                        {/* Edit */}
                        <button onClick={() => onEdit(item)}
                          title="Edit item"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: 'var(--text3)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <Pencil size={13} />
                        </button>

                        {/* Delete */}
                        <button onClick={() => setDelItem(item)}
                          title="Delete item"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{ color: 'var(--red)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button className="btn-icon w-8 h-8 rounded-lg" disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn-icon w-8 h-8 rounded-lg" disabled={filters.page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog open={!!delItem} onClose={() => setDelItem(null)}
        onConfirm={confirmDelete} loading={delLoading}
        title="Delete item?"
        description={`"${delItem?.name}" will be removed from your inventory.`} />
    </>
  );
}
