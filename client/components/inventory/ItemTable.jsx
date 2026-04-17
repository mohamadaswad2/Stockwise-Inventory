/**
 * ItemTable — Premium responsive inventory table
 * Desktop: sticky-header data table with hover actions
 * Mobile: compact item rows with dot-menu (no horizontal scroll)
 */
import { useState, useRef, useEffect } from 'react';
import {
  Pencil, Trash2, ChevronLeft, ChevronRight, Package,
  ShoppingCart, PackagePlus, MoreVertical, History,
  AlertTriangle, CheckCircle, XCircle, TrendingDown,
} from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import Spinner from '../ui/Spinner';
import { useCurrency } from '../../contexts/CurrencyContext';

/* ── Stock badge ──────────────────────────────────────────────────────────── */
function StockBadge({ qty, threshold }) {
  if (qty === 0)        return <span className="badge badge-red"><XCircle size={10}/> Out of stock</span>;
  if (qty <= threshold) return <span className="badge badge-yellow"><TrendingDown size={10}/> Low stock</span>;
  return <span className="badge badge-green"><CheckCircle size={10}/> In stock</span>;
}

/* ── Dot menu (mobile & desktop actions) ──────────────────────────────────── */
function DotMenu({ item, onEdit, onDelete, onRestock, onOpen }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('touchstart', handler); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="btn-icon"
        style={{ width: 32, height: 32, fontSize: 13 }}
        aria-label="More actions">
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="dropdown" style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          minWidth: 160, zIndex: 50,
        }}>
          <div className="dropdown-item" onClick={() => { onRestock?.(item); setOpen(false); }}>
            <PackagePlus size={14} /> Restock
          </div>
          <div className="dropdown-item" onClick={() => { onEdit(item); setOpen(false); }}>
            <Pencil size={14} /> Edit item
          </div>
          <div className="dropdown-item" onClick={() => { setOpen(false); }}>
            <History size={14} /> History
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <div className="dropdown-item danger" onClick={() => { onDelete(item); setOpen(false); }}>
            <Trash2 size={14} /> Delete
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile compact row ───────────────────────────────────────────────────── */
function MobileItemRow({ item, onQuickSell, onEdit, onDelete, onRestock }) {
  const { format } = useCurrency();
  const qty     = Number(item.quantity);
  const price   = Number(item.price);
  const cost    = Number(item.cost_price || 0);
  const margin  = price > 0 && cost > 0 ? Math.round(((price - cost) / price) * 100) : null;
  const canSell = qty > 0;

  return (
    <div className="item-row">
      {/* Left: item info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
          <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', letterSpacing: '-0.1px' }}
             className="truncate">{item.name}</p>
          {item.sku && (
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace', flexShrink: 0 }}>
              {item.sku}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ fontWeight: 600, color: qty === 0 ? 'var(--red)' : qty <= item.low_stock_threshold ? 'var(--orange)' : 'var(--text2)' }}>
              {qty}
            </span>
            {' '}{item.unit}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
            {format(price)}
          </span>
          {margin !== null && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: margin >= 20 ? 'var(--green)' : 'var(--orange)', fontWeight: 600 }}>
                {margin}% margin
              </span>
            </>
          )}
          {item.category_name && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.category_name}</span>
            </>
          )}
        </div>
        {qty === 0 && (
          <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 2, fontWeight: 500 }}>Out of stock</p>
        )}
        {qty > 0 && qty <= item.low_stock_threshold && (
          <p style={{ fontSize: 11, color: 'var(--orange)', marginTop: 2, fontWeight: 500 }}>
            <AlertTriangle size={10} style={{ display: 'inline', marginRight: 2 }} />
            Low stock
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => canSell && onQuickSell?.(item)}
          disabled={!canSell}
          className="btn-primary"
          style={{
            height: 34, paddingLeft: 12, paddingRight: 12,
            fontSize: 12, fontWeight: 600, gap: 5,
            opacity: canSell ? 1 : 0.35,
          }}>
          <ShoppingCart size={13} /> Sell
        </button>
        <DotMenu item={item} onEdit={onEdit} onDelete={onDelete} onRestock={onRestock} />
      </div>
    </div>
  );
}

/* ── Desktop table row ────────────────────────────────────────────────────── */
function DesktopRow({ item, onEdit, onDelete, onQuickSell, onRestock, setDelItem }) {
  const { format } = useCurrency();
  const price  = Number(item.price);
  const cost   = Number(item.cost_price || 0);
  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(0) : 0;
  const isMarginGood = Number(margin) >= 20;

  return (
    <tr>
      <td>
        <div>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', letterSpacing: '-0.1px' }}>
            {item.name}
          </p>
          {item.sku && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>{item.sku}</span>
          )}
        </div>
      </td>
      <td style={{ color: 'var(--text3)', fontSize: 12 }}>{item.category_name || '—'}</td>
      <td>
        <span style={{ fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
          {item.quantity}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 4 }}>{item.unit}</span>
      </td>
      <td>
        <span style={{ fontWeight: 600, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
          {format(price)}
        </span>
      </td>
      <td>
        {cost > 0
          ? <span style={{ fontWeight: 500, color: 'var(--orange)', fontVariantNumeric: 'tabular-nums' }}>{format(cost)}</span>
          : <span style={{ color: 'var(--text3)' }}>—</span>}
      </td>
      <td>
        {cost > 0 ? (
          <span className="badge" style={{
            background: isMarginGood ? 'var(--green-bg)' : 'var(--orange-bg)',
            color: isMarginGood ? 'var(--green)' : 'var(--orange)',
          }}>{margin}%</span>
        ) : <span style={{ color: 'var(--text3)', fontSize: 11 }}>—</span>}
      </td>
      <td><StockBadge qty={item.quantity} threshold={item.low_stock_threshold} /></td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => onQuickSell?.(item)}
            disabled={item.quantity === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: item.quantity > 0 ? 'var(--accent-bg)' : 'var(--surface2)',
              color: item.quantity > 0 ? 'var(--accent3)' : 'var(--text3)',
              border: `1px solid ${item.quantity > 0 ? 'var(--accent-border)' : 'var(--border)'}`,
              cursor: item.quantity > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={e => { if (item.quantity > 0) e.currentTarget.style.background = 'rgba(91,91,214,0.18)'; }}
            onMouseLeave={e => { if (item.quantity > 0) e.currentTarget.style.background = 'var(--accent-bg)'; }}
          >
            <ShoppingCart size={12} /> Sell
          </button>
          <button
            onClick={() => onRestock?.(item)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: 'var(--green-bg)',
              color: 'var(--green)',
              border: '1px solid rgba(61,214,140,0.25)',
              cursor: 'pointer', transition: 'all 150ms ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(61,214,140,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--green-bg)'}
          >
            <PackagePlus size={12} /> Restock
          </button>
          <button onClick={() => onEdit(item)}
            className="btn-icon" style={{ width: 30, height: 30 }} title="Edit">
            <Pencil size={13} />
          </button>
          <button onClick={() => setDelItem(item)}
            className="btn-icon"
            style={{ width: 30, height: 30, color: 'var(--red)', background: 'var(--red-bg)', border: '1px solid rgba(229,72,77,0.2)' }}
            title="Delete">
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function ItemTable({
  items, total, loading, filters, setFilters,
  onEdit, onDelete, onQuickSell, onRestock
}) {
  const [delItem,    setDelItem]    = useState(null);
  const [delLoading, setDelLoading] = useState(false);
  const totalPages = Math.ceil(total / (filters.limit || 20));

  const confirmDelete = async () => {
    setDelLoading(true);
    try { await onDelete(delItem.id); }
    finally { setDelLoading(false); setDelItem(null); }
  };

  // Initial load spinner
  if (loading && !items.length) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  // Empty state
  if (!items.length && !loading) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon"><Package size={24} /></div>
          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>No items found</p>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Add your first item to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card" style={{ position: 'relative' }}>
        {/* Loading overlay */}
        {loading && items.length > 0 && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(var(--surface-rgb, 255,255,255),0.7)',
            backdropFilter: 'blur(2px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-lg)',
          }}>
            <Spinner size="md" />
          </div>
        )}

        {/* ── MOBILE: compact rows (< 768px) ──────────────────────────── */}
        <div className="block md:hidden" style={{ opacity: loading ? 0.6 : 1 }}>
          {items.map(item => (
            <MobileItemRow
              key={item.id} item={item}
              onQuickSell={onQuickSell} onEdit={onEdit}
              onDelete={(i) => setDelItem(i)} onRestock={onRestock}
            />
          ))}
        </div>

        {/* ── DESKTOP: premium table (≥ 768px) ────────────────────────── */}
        <div className="hidden md:block" style={{ opacity: loading ? 0.6 : 1 }}>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  {['Item', 'Category', 'Stock', 'Price', 'Cost', 'Margin', 'Status', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <DesktopRow
                    key={item.id} item={item}
                    onEdit={onEdit} onDelete={onDelete}
                    onQuickSell={onQuickSell} onRestock={onRestock}
                    setDelItem={setDelItem}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-icon" style={{ width: 32, height: 32 }}
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              <button className="btn-icon" style={{ width: 32, height: 32 }}
                disabled={filters.page >= totalPages}
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
        description={`"${delItem?.name}" will be permanently removed.`}
      />
    </>
  );
}
