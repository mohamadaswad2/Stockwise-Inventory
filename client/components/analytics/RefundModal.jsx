/**
 * RefundModal — process a refund for a sale transaction
 *
 * Props:
 *   transaction  — the original sale tx object from TransactionList
 *   isOpen       — boolean
 *   onClose      — fn()
 *   onSuccess    — fn() called after successful refund
 */
import { useState } from 'react';
import { RotateCcw, X, AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { refundTransaction } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function RefundModal({ transaction, isOpen, onClose, onSuccess }) {
  const { format } = useCurrency();
  const [qty,     setQty]     = useState(1);
  const [reason,  setReason]  = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  if (!isOpen || !transaction) return null;

  const maxQty       = Number(transaction.quantity || 0);
  const unitPrice    = Number(transaction.unit_price || 0);
  const refundAmount = qty * unitPrice;
  const canSubmit    = qty >= 1 && qty <= maxQty && !loading;

  const adjust = (delta) =>
    setQty(v => Math.min(maxQty, Math.max(1, v + delta)));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await refundTransaction({
        originalTransactionId: transaction.id,
        itemId:                transaction.item_id,
        quantity:              qty,
        unitPrice:             Number(transaction.unit_price || 0),
        costPrice:             Number(transaction.cost_price || 0),
        reason:                reason.trim() || 'Customer refund',
      });
      setDone(true);
      toast.success(`✅ Refunded ${qty} × ${transaction.item_name}`, { duration: 4000 });
      setTimeout(() => {
        onSuccess?.();
        onClose();
        setDone(false);
        setQty(1);
        setReason('');
      }, 1200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} className="sm:items-center">
      {/* Blur overlay */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Panel — bottom sheet mobile, centered desktop */}
      <div className="animate-slide-up" style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '20px 20px 0 0',
        overflow: 'hidden',
      }}>
        <style>{`
          @media (min-width: 640px) { .refund-panel { border-radius: 20px !important; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Drag handle — mobile */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 2px' }}
          className="sm:hidden">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--surface3)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 12px', borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={16} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Process Refund</p>
              <p style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 220 }} className="truncate">
                {transaction.item_name}
              </p>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)' }}>
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '18px 20px 20px' }}>

          {done ? (
            /* Success state */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 10 }}>
              <CheckCircle2 size={44} style={{ color: 'var(--green)' }} />
              <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>Refund Processed!</p>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                {qty} × {transaction.item_name} — {format(refundAmount)} refunded
              </p>
            </div>
          ) : (
            <>
              {/* Original sale info */}
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Original Sale
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                      {transaction.quantity} × {transaction.item_name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                      @ {format(unitPrice)} each
                    </p>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--green)', fontVariantNumeric: 'tabular-nums' }}>
                    {format(transaction.quantity * unitPrice)}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '9px 12px', borderRadius: 9, marginBottom: 16,
                background: 'var(--orange-bg)', border: '1px solid rgba(247,107,21,0.2)',
              }}>
                <AlertTriangle size={13} style={{ color: 'var(--orange)', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: 'var(--orange)', lineHeight: 1.5 }}>
                  Refund will restore stock and record a deduction in revenue. This cannot be undone.
                </p>
              </div>

              {/* Qty selector */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>
                  Quantity to refund
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button onClick={() => adjust(-1)} disabled={qty <= 1}
                    style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: qty <= 1 ? 'not-allowed' : 'pointer', opacity: qty <= 1 ? 0.4 : 1, flexShrink: 0 }}>
                    <Minus size={15} style={{ color: 'var(--text2)' }} />
                  </button>
                  <input
                    type="number" min={1} max={maxQty}
                    value={qty}
                    onChange={e => setQty(Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1)))}
                    style={{ flex: 1, height: 40, textAlign: 'center', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 18, fontWeight: 800, outline: 'none', fontVariantNumeric: 'tabular-nums' }}
                    onFocus={e => e.target.style.borderColor = 'var(--red)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <button onClick={() => adjust(1)} disabled={qty >= maxQty}
                    style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: qty >= maxQty ? 'not-allowed' : 'pointer', opacity: qty >= maxQty ? 0.4 : 1, flexShrink: 0 }}>
                    <Plus size={15} style={{ color: 'var(--text2)' }} />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, textAlign: 'center' }}>
                  Max refundable: {maxQty} {transaction.unit}
                </p>
              </div>

              {/* Reason */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                  Reason <span style={{ fontWeight: 400, color: 'var(--text3)' }}>(optional)</span>
                </p>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Wrong item, customer request…"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  maxLength={120}
                  style={{ height: 38, fontSize: 13 }}
                />
              </div>

              {/* Refund summary */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 10, marginBottom: 16,
                background: 'var(--red-bg)', border: '1px solid rgba(242,85,90,0.2)',
              }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Refund amount</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--red)', fontVariantNumeric: 'tabular-nums' }}>
                  {format(refundAmount)}
                </span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose}
                  style={{ flex: 1, height: 44, borderRadius: 11, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface3)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={!canSubmit}
                  style={{
                    flex: 2, height: 44, borderRadius: 11, fontSize: 13, fontWeight: 700,
                    background: canSubmit ? 'var(--red)' : 'var(--surface2)',
                    color: canSubmit ? '#fff' : 'var(--text3)',
                    border: canSubmit ? 'none' : '1px solid var(--border)',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 200ms ease',
                    boxShadow: canSubmit ? '0 4px 14px rgba(242,85,90,0.35)' : 'none',
                  }}>
                  {loading
                    ? <><span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} /> Processing…</>
                    : <><RotateCcw size={14} /> Confirm Refund</>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
