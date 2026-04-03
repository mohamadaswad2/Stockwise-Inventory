/**
 * RestockModal — tambah stok balik dengan option update cost price.
 * Lebih clear dari "Full Transaction" — user faham terus apa dia buat.
 */
import { useState } from 'react';
import { PackagePlus, Minus, Plus, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { restockItem } from '../../services/inventory.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function RestockModal({ item, onClose, onSuccess }) {
  const { format, symbol } = useCurrency();
  const [qty,      setQty]      = useState(1);
  const [costPx,   setCostPx]   = useState('');
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);
  const [updateCost, setUpdateCost] = useState(false);

  const handleRestock = async () => {
    if (qty < 1) { toast.error('Quantity must be at least 1.'); return; }
    setLoading(true);
    try {
      await restockItem(item.id, {
        quantity:   qty,
        cost_price: updateCost && costPx !== '' ? Number(costPx) : undefined,
        note:       note || `Restock +${qty} ${item.unit}`,
      });
      toast.success(`✅ Restocked ${qty} × ${item.name}!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restock.');
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
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.12)' }}>
              <PackagePlus size={18} style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Restock Item</h2>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>
                {item?.name} · currently <strong style={{ color: 'var(--text)' }}>{item?.quantity} {item?.unit}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Quantity */}
          <div>
            <label className="label">How many units to add?</label>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <Minus size={16} />
              </button>
              <input type="number" min="1"
                value={qty}
                onChange={e => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 text-center text-2xl font-black input py-2.5"
                style={{ color: 'var(--text)' }} />
              <button type="button"
                onClick={() => setQty(q => q + 1)}
                className="w-11 h-11 rounded-xl flex items-center justify-center font-bold transition-all"
                style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}>
                <Plus size={16} />
              </button>
            </div>

            {/* After restock preview */}
            <div className="flex justify-between mt-2 px-1">
              <span className="text-xs" style={{ color: 'var(--text3)' }}>Current stock</span>
              <span className="text-xs font-bold" style={{ color: 'var(--text2)' }}>{item?.quantity} {item?.unit}</span>
            </div>
            <div className="flex justify-between px-1">
              <span className="text-xs" style={{ color: 'var(--text3)' }}>After restock</span>
              <span className="text-xs font-bold" style={{ color: 'var(--green)' }}>
                {(item?.quantity || 0) + qty} {item?.unit}
              </span>
            </div>
          </div>

          {/* Cost price update — optional */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none mb-2">
              <div
                onClick={() => setUpdateCost(v => !v)}
                className="w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer"
                style={{
                  background: updateCost ? 'var(--accent)' : 'var(--surface2)',
                  border: `2px solid ${updateCost ? 'var(--accent)' : 'var(--border2)'}`,
                }}>
                {updateCost && <span className="text-white text-xs font-black">✓</span>}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text2)' }}>
                Update cost price for this batch
              </span>
            </label>

            {updateCost && (
              <div className="animate-fade-in">
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text3)' }} />
                  <input type="number" min="0" step="0.01"
                    className="input pl-9"
                    placeholder={`New cost price (${symbol}) — current: ${format(item?.cost_price || 0)}`}
                    value={costPx}
                    onChange={e => setCostPx(e.target.value)} />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                  Updates the cost price used to calculate future profit.
                </p>
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" className="input"
              placeholder={`e.g. Purchase from Supplier A`}
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="button" onClick={handleRestock} disabled={loading}
              className="flex-1 btn text-white font-bold py-2.5 rounded-xl gap-2"
              style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
              <PackagePlus size={15} />
              {loading ? 'Saving…' : `Add ${qty} ${item?.unit}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
