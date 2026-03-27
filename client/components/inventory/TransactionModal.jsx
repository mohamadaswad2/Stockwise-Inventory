import { useState } from 'react';
import { TrendingDown, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { recordTransaction } from '../../services/transaction.service';

const TYPES = [
  { key: 'sale',       label: 'Sale',        icon: TrendingDown, color: 'var(--ios-blue)',   desc: 'Sold to customer' },
  { key: 'usage',      label: 'Usage',       icon: Zap,          color: 'var(--ios-orange)', desc: 'Used internally' },
  { key: 'restock',    label: 'Restock',     icon: TrendingUp,   color: 'var(--ios-green)',  desc: 'Add stock' },
  { key: 'adjustment', label: 'Adjustment',  icon: RefreshCw,    color: 'var(--ios-purple)', desc: 'Manual correction' },
];

export default function TransactionModal({ item, onClose, onSuccess }) {
  const [type,     setType]     = useState('sale');
  const [qty,      setQty]      = useState('1');
  const [price,    setPrice]    = useState(String(item?.price ?? ''));
  const [note,     setNote]     = useState('');
  const [loading,  setLoading]  = useState(false);

  const selectedType = TYPES.find(t => t.key === type);
  const isSaleUsage  = type === 'sale' || type === 'usage';
  const total        = (Number(qty) * Number(price)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(qty) <= 0) { toast.error('Quantity must be greater than 0.'); return; }
    if (isSaleUsage && Number(qty) > item.quantity) {
      toast.error(`Max available: ${item.quantity} ${item.unit}`); return;
    }
    setLoading(true);
    try {
      await recordTransaction({
        itemId:    item.id,
        type,
        quantity:  Number(qty),
        unitPrice: Number(price),
        note:      note || undefined,
      });
      toast.success(`${selectedType.label} recorded! Stock updated.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record transaction.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--ios-surface)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--ios-separator)' }} />
        </div>

        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--ios-separator)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>Record Transaction</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ios-text2)' }}>{item?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="label">Transaction Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ key, label, icon: Icon, color, desc }) => (
                <button key={key} type="button" onClick={() => setType(key)}
                  className={clsx('flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-150 text-left',
                    type === key ? 'border-current' : 'border-transparent')}
                  style={{
                    background: type === key ? `${color}15` : 'var(--ios-surface2)',
                    borderColor: type === key ? color : 'transparent',
                  }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--ios-text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--ios-text2)' }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" min="1"
                max={isSaleUsage ? item?.quantity : undefined}
                value={qty} onChange={e => setQty(e.target.value)} required />
              {isSaleUsage && (
                <p className="text-xs mt-1" style={{ color: 'var(--ios-text2)' }}>
                  Available: {item?.quantity} {item?.unit}
                </p>
              )}
            </div>
            <div>
              <label className="label">Unit Price (RM)</label>
              <input type="number" className="input" min="0" step="0.01"
                value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          {/* Total preview */}
          {type === 'sale' && Number(qty) > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl"
              style={{ background: 'rgba(52,199,89,0.08)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--ios-text2)' }}>Total Revenue</span>
              <span className="text-lg font-bold" style={{ color: 'var(--ios-green)' }}>RM {total}</span>
            </div>
          )}

          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <input type="text" className="input" placeholder="e.g. Order #1234"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1"
              style={{ background: selectedType.color }}>
              {loading ? 'Saving…' : `Record ${selectedType.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}