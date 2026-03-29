import { useState } from 'react';
import { TrendingDown, TrendingUp, Zap, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { recordTransaction } from '../../services/transaction.service';

const TYPES = [
  { key: 'sale',       label: 'Sale',       icon: TrendingDown, color: '#6366f1', desc: 'Sold to customer' },
  { key: 'usage',      label: 'Usage',      icon: Zap,          color: '#f59e0b', desc: 'Used internally' },
  { key: 'restock',    label: 'Restock',    icon: TrendingUp,   color: '#22c55e', desc: 'Add stock' },
  { key: 'adjustment', label: 'Adjustment', icon: RefreshCw,    color: '#a855f7', desc: 'Correction' },
];

export default function TransactionModal({ item, onClose, onSuccess }) {
  const [type,    setType]    = useState('sale');
  const [qty,     setQty]     = useState('1');
  const [price,   setPrice]   = useState(String(item?.price ?? ''));
  const [note,    setNote]    = useState('');
  const [loading, setLoading] = useState(false);

  const sel = TYPES.find(t => t.key === type);
  const isSaleUsage = type === 'sale' || type === 'usage';
  const total = (Number(qty) * Number(price)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Number(qty) <= 0) { toast.error('Quantity must be greater than 0.'); return; }
    if (isSaleUsage && Number(qty) > item.quantity) {
      toast.error(`Only ${item.quantity} ${item.unit} available.`); return;
    }
    setLoading(true);
    try {
      await recordTransaction({ itemId: item.id, type, quantity: Number(qty), unitPrice: Number(price), note: note || undefined });
      toast.success(`${sel.label} recorded! Stock updated.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface3)' }} />
        </div>
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Record Transaction</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{item?.name} · {item?.quantity} {item?.unit} in stock</p>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(({ key, label, icon: Icon, color, desc }) => (
                <button key={key} type="button" onClick={() => setType(key)}
                  className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-150"
                  style={{
                    background: type === key ? `${color}15` : 'var(--surface2)',
                    border: `1.5px solid ${type === key ? color : 'var(--border)'}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>{desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Quantity</label>
              <input type="number" className="input" min="1"
                max={isSaleUsage ? item?.quantity : undefined}
                value={qty} onChange={e => setQty(e.target.value)} required />
              {isSaleUsage && (
                <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
                  Max: {item?.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="label">Unit Price (RM)</label>
              <input type="number" className="input" min="0" step="0.01"
                value={price} onChange={e => setPrice(e.target.value)} />
            </div>
          </div>

          {type === 'sale' && Number(qty) > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--text2)' }}>Total Revenue</span>
              <span className="text-lg font-bold" style={{ color: 'var(--green)' }}>RM {total}</span>
            </div>
          )}

          <div>
            <label className="label">Note (optional)</label>
            <input type="text" className="input" placeholder="e.g. Order #1234"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 btn text-white font-semibold py-2.5 rounded-xl"
              style={{ background: sel.color }}>
              {loading ? 'Saving…' : `Record ${sel.label}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
