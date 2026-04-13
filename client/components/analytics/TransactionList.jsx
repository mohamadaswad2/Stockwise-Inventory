/**
 * TransactionList - Displays list of transactions with refund capability
 * Shows all transaction types (sale, refund, restock, adjustment)
 * Allows refunding sales transactions
 */
import { useState } from 'react';
import { RotateCcw, Package, ArrowUpRight, ArrowDownRight, MinusCircle } from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import RefundModal from './RefundModal';

const TYPE_CONFIG = {
  sale:       { icon: ArrowUpRight,   color: 'var(--green)',  label: 'Sale',       bg: 'rgba(34,197,94,0.1)' },
  refund:     { icon: RotateCcw,      color: 'var(--red)',    label: 'Refund',     bg: 'rgba(239,68,68,0.1)' },
  restock:    { icon: Package,        color: 'var(--accent3)',label: 'Restock',    bg: 'rgba(99,102,241,0.1)' },
  adjustment: { icon: MinusCircle,    color: 'var(--orange)',  label: 'Adjustment', bg: 'rgba(245,158,11,0.1)' },
  usage:      { icon: ArrowDownRight, color: 'var(--text3)',  label: 'Usage',      bg: 'rgba(156,163,175,0.1)' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-MY', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function TransactionList({ transactions, onRefundSuccess }) {
  const { format } = useCurrency();
  const [refundTx, setRefundTx] = useState(null);

  const handleRefundSuccess = () => {
    setRefundTx(null);
    onRefundSuccess?.();
  };

  if (!transactions?.length) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text3)' }}>
        No transactions found
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
              {['Type', 'Item', 'Qty', 'Price', 'Total', 'Time', 'Actions'].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-semibold uppercase"
                    style={{ color: 'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => {
              const config = TYPE_CONFIG[tx.type] || TYPE_CONFIG.usage;
              const Icon = config.icon;
              const isSale = tx.type === 'sale';
              const isRefund = tx.type === 'refund';
              const total = (tx.quantity || 0) * (tx.unit_price || 0);

              return (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--border2)' }}
                    className="hover:bg-opacity-50 transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                  {/* Type */}
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium"
                          style={{ color: config.color, background: config.bg }}>
                      <Icon size={14} />
                      {config.label}
                    </span>
                  </td>

                  {/* Item */}
                  <td className="px-3 py-3">
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text)' }}>{tx.item_name}</p>
                      {tx.sku && <p className="text-xs" style={{ color: 'var(--text3)' }}>{tx.sku}</p>}
                    </div>
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-3 tabular-nums" style={{ color: 'var(--text)' }}>
                    {tx.quantity} {tx.unit}
                  </td>

                  {/* Unit Price */}
                  <td className="px-3 py-3 tabular-nums" style={{ color: 'var(--text2)' }}>
                    {format(tx.unit_price)}
                  </td>

                  {/* Total */}
                  <td className="px-3 py-3 tabular-nums font-medium"
                      style={{ color: isRefund ? 'var(--red)' : 'var(--text)' }}>
                    {isRefund ? '-' : ''}{format(total)}
                  </td>

                  {/* Time */}
                  <td className="px-3 py-3 text-xs" style={{ color: 'var(--text3)' }}>
                    {formatDate(tx.created_at)}
                  </td>

                  {/* Actions - Refund button for sales */}
                  <td className="px-3 py-3">
                    {isSale && (
                      <button
                        onClick={() => setRefundTx(tx)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                                   hover:bg-red-50 transition-colors"
                        style={{ color: 'var(--red)' }}
                      >
                        <RotateCcw size={14} />
                        Refund
                      </button>
                    )}
                    {isRefund && tx.note && (
                      <span className="text-xs" style={{ color: 'var(--text3)' }}>
                        {tx.note}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Refund Modal */}
      {refundTx && (
        <RefundModal
          transaction={refundTx}
          isOpen={!!refundTx}
          onClose={() => setRefundTx(null)}
          onSuccess={handleRefundSuccess}
        />
      )}
    </>
  );
}
