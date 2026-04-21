import { useState } from 'react';
import { ShoppingCart, Minus, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { quickSell } from '../../services/inventory.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function QuickSellModal({ item, onClose, onSuccess }) {
  const { format } = useCurrency();
  const [qty,     setQty]     = useState(1);
  const [loading, setLoading] = useState(false);

  const maxQty    = item?.quantity || 0;
  const unitPrice = Number(item?.price || 0);
  const costPrice = Number(item?.cost_price || 0);
  const total     = qty * unitPrice;
  const profit    = (unitPrice - costPrice) * qty;
  const canSell   = qty >= 1 && qty <= maxQty;

  const adjust = (delta) => {
    setQty(v => Math.min(maxQty, Math.max(1, v + delta)));
  };

  const handleSell = async () => {
    if (!canSell || loading) return;
    setLoading(true);
    try {
      // quickSell(id, qty) → service wraps as { quantity: qty }
      await quickSell(item.id, qty);
      toast.success(`✅ Sold ${qty} × ${item.name}!`, { duration: 3000 });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale.');
    } finally { setLoading(false); }
  };

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}
    className="sm:items-center">
      {/* Blur overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose} />

      {/* Modal panel — bottom sheet on mobile, centered on desktop */}
      <div className="animate-slide-up" style={{
        position: 'relative', width: '100%', maxWidth: 380,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }}
      // On desktop: full rounded
      >
        <style>{`
          @media (min-width: 640px) {
            .qs-panel { border-radius: 20px !important; }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Mobile handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}
          className="sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--surface3)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={17} style={{ color: 'var(--accent3)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Quick Sell</p>
              <p style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 220 }} className="truncate">{item?.name}</p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 20px' }}>
          {/* Stock info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>Available stock</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: maxQty <= item?.low_stock_threshold ? 'var(--orange)' : 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
              {maxQty} {item?.unit}
            </span>
          </div>

          {/* Quantity selector */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Quantity to sell</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => adjust(-1)} disabled={qty <= 1}
                style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: qty <= 1 ? 'not-allowed' : 'pointer', opacity: qty <= 1 ? 0.4 : 1, flexShrink: 0, transition: 'all 150ms' }}>
                <Minus size={16} style={{ color: 'var(--text2)' }} />
              </button>

              <input
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={e => {
                  const v = parseInt(e.target.value) || 1;
                  setQty(Math.min(maxQty, Math.max(1, v)));
                }}
                style={{ flex: 1, height: 42, textAlign: 'center', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', outline: 'none', fontVariantNumeric: 'tabular-nums' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />

              <button onClick={() => adjust(1)} disabled={qty >= maxQty}
                style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: qty >= maxQty ? 'not-allowed' : 'pointer', opacity: qty >= maxQty ? 0.4 : 1, flexShrink: 0, transition: 'all 150ms' }}>
                <Plus size={16} style={{ color: 'var(--text2)' }} />
              </button>
            </div>
          </div>

          {/* Sale summary */}
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Unit price',  value: format(unitPrice),  color: 'var(--text)' },
              { label: 'Total',       value: format(total),      color: 'var(--green)', bold: true },
              ...(costPrice > 0 ? [{ label: 'Est. profit', value: format(profit), color: profit >= 0 ? 'var(--accent3)' : 'var(--red)' }] : []),
            ].map(({ label, value, color, bold }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</span>
                <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 800 : 600, color, fontVariantNumeric: 'tabular-nums' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose}
              style={{ flex: 1, height: 44, borderRadius: 11, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
              Cancel
            </button>
            <button onClick={handleSell} disabled={!canSell || loading}
              style={{
                flex: 2, height: 44, borderRadius: 11, fontSize: 13, fontWeight: 700,
                background: !canSell ? 'var(--surface2)' : 'var(--accent)',
                color: !canSell ? 'var(--text3)' : '#fff',
                border: !canSell ? '1px solid var(--border)' : 'none',
                cursor: !canSell || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: canSell && !loading ? '0 4px 14px rgba(91,91,214,0.35)' : 'none',
                transition: 'all 200ms ease',
              }}>
              {loading ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                  Recording…
                </>
              ) : (
                <><ShoppingCart size={15} /> Confirm Sale</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
