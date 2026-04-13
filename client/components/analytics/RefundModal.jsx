/**
 * RefundModal - Modal for processing refunds on sale transactions
 * Creates a new refund transaction and restores inventory
 */
import { useState, useEffect, useCallback } from 'react';
import { X, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { refundTransaction } from '../../services/transaction.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function RefundModal({ transaction, isOpen, onClose, onSuccess }) {
  const { format } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setQuantity(transaction.quantity || 1);
      setReason('');
      setError(null);
    }
  }, [isOpen, transaction]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!transaction) return;

    // Validation
    if (quantity < 1) {
      setError('Refund quantity must be at least 1');
      return;
    }
    if (quantity > transaction.quantity) {
      setError(`Cannot refund more than original quantity (${transaction.quantity})`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await refundTransaction({
        originalTransactionId: transaction.id,
        itemId: transaction.item_id,
        quantity: quantity,
        unitPrice: transaction.unit_price,
        costPrice: transaction.cost_price,
        reason: reason || 'Customer refund',
      });

      toast.success(`✅ Refunded ${quantity} × ${transaction.item_name}`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to process refund';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [transaction, quantity, reason, onSuccess, onClose]);

  if (!isOpen || !transaction) return null;

  const maxQty = transaction.quantity || 0;
  const refundTotal = quantity * (transaction.unit_price || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-full max-w-md p-6 relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(239,68,68,0.1)' }}>
              <RotateCcw size={20} style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Process Refund</h2>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{transaction.item_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  style={{ color: 'var(--text2)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Original Transaction Info */}
        <div className="mb-6 p-3 rounded-lg" style={{ background: 'var(--surface2)' }}>
          <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
            Original Sale
          </p>
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: 'var(--text2)' }}>Quantity:</span>
            <span style={{ color: 'var(--text)' }}>{transaction.quantity} {transaction.unit}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: 'var(--text2)' }}>Unit Price:</span>
            <span style={{ color: 'var(--text)' }}>{format(transaction.unit_price)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span style={{ color: 'var(--text)' }}>Total:</span>
            <span style={{ color: 'var(--text)' }}>{format(transaction.quantity * transaction.unit_price)}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>

          {/* Quantity */}
          <div className="mb-4">
            <label className="label flex items-center justify-between">
              <span>Refund Quantity *</span>
              <span className="text-xs font-normal" style={{ color: 'var(--text3)' }}>
                Max: {maxQty}
              </span>
            </label>
            <input
              type="number"
              min="1"
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="input"
              required
            />
          </div>

          {/* Reason */}
          <div className="mb-4">
            <label className="label">Reason (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              placeholder="e.g., Defective item, Customer request..."
            />
          </div>

          {/* Refund Preview */}
          <div className="mb-4 p-3 rounded-lg border-l-4"
               style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'var(--red)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--red)' }}>Refund Amount</p>
            <p className="text-xl font-bold" style={{ color: 'var(--red)' }}>
              -{format(refundTotal)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text3)' }}>
              {quantity} {transaction.unit} × {format(transaction.unit_price)}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-lg flex items-start gap-2"
                 style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertCircle size={16} style={{ color: 'var(--red)', flexShrink: 0, marginTop: 2 }} />
              <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              disabled={loading}
            >
              {loading ? 'Processing...' : `Refund ${format(refundTotal)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
