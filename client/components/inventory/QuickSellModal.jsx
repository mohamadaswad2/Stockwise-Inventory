/**
 * QuickSellModal — simplified one-click sell.
 * User just enters quantity. No type selection needed.
 * Stock auto-deducts immediately.
 */
import { useState } from 'react';
import { ShoppingCart, Minus, Plus, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { quickSell } from '../../services/inventory.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function QuickSellModal({ item, onClose, onSuccess }) {
  const { format } = useCurrency();
  const [qty,     setQty]     = useState(1);
  const [loading, setLoading] = useState(false);

  const maxQty    = item?.quantity || 0;
  const unitPrice = Number(item?.price || 0);
  const total     = format(qty * unitPrice);
  const profit    = format((unitPrice - Number(item?.cost_price || 0)) * qty);
  const canSell   = qty > 0 && qty <= maxQty;

  const handleSell = async () => {
    if (!canSell) return;
    setLoading(true);
    try {
      await quickSell(item.id, qty);
      toast.success(`✅ Sold ${qty} × ${item.name}!`, { duration: 3000 });
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />

      <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface3)' }} />
        </div>

        {/* Header */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.12)' }}>
              <ShoppingCart size={18} style={{ color: 'var(--accent3)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Quick Sell</h2>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>{item?.name}</p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
          {/* Stock info */}
          <div className="flex items-center justify-between pt-4">
            <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
              Available stock
            </span>
            <span className="text-sm font-bold" style={{ color: maxQty === 0 ? 'var(--red)' : 'var(--green)' }}>
              {maxQty} {item?.unit}
            </span>
          </div>

          {/* Quantity selector */}
          <div>
            <label className="label">How many did you sell?</label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <Minus size={16} />
              </button>

              <input type="number" min="1" max={maxQty}
                value={qty}
                onChange={e => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
                className="flex-1 text-center text-2xl font-black input py-2.5"
                style={{ color: 'var(--text)' }} />

              <button type="button"
                onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                disabled={qty >= maxQty}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <Plus size={16} />
              </button>
            </div>

            {/* Quick qty buttons */}
            {maxQty > 1 && (
              <div className="flex gap-2 mt-2">
                {[1, 5, 10, maxQty].filter((v, i, a) => a.indexOf(v) === i && v <= maxQty).map(v => (
                  <button key={v} type="button"
                    onClick={() => setQty(v)}
                    className="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
                    style={{
                      background: qty === v ? 'var(--accent)' : 'var(--surface2)',
                      color: qty === v ? 'white' : 'var(--text2)',
                    }}>
                    {v === maxQty ? 'All' : v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="rounded-xl p-4 space-y-2"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text2)' }}>Unit price</span>
              <span style={{ color: 'var(--text)' }}>{format(unitPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text2)' }}>Quantity</span>
              <span style={{ color: 'var(--text)' }}>× {qty}</span>
            </div>
            <div className="h-px" style={{ background: 'var(--border)' }} />
            <div className="flex justify-between">
              <span className="font-bold" style={{ color: 'var(--text)' }}>Total Revenue</span>
              <span className="text-lg font-black" style={{ color: 'var(--green)' }}>{total}</span>
            </div>
            {Number(item?.cost_price) > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--text3)' }}>Est. Profit</span>
                <span style={{ color: 'var(--accent3)' }}>{profit}</span>
              </div>
            )}
          </div>

          {maxQty === 0 && (
            <div className="p-3 rounded-xl text-xs text-center"
              style={{ background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.15)' }}>
              ⚠️ Out of stock — please restock first.
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="button" onClick={handleSell}
              disabled={loading || !canSell}
              className="flex-1 btn text-white font-bold py-2.5 rounded-xl gap-2"
              style={{ background: canSell ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface3)',
                       boxShadow: canSell ? '0 0 20px var(--glow)' : 'none' }}>
              <Zap size={15} />
              {loading ? 'Processing…' : 'Confirm Sale'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
