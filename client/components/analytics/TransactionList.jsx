/**
 * TransactionList — Premium responsive transaction table
 * Desktop: full data table with all columns
 * Mobile: compact stacked rows — no horizontal scroll
 */
import { useState } from 'react';
import {
  RotateCcw, Package, ArrowUpRight, ArrowDownRight,
  MinusCircle, Receipt, MoreVertical, Printer,
} from 'lucide-react';
import { useCurrency } from '../../contexts/CurrencyContext';
import RefundModal from './RefundModal';

const TYPE_CONFIG = {
  sale:       { icon: ArrowUpRight,   color: 'var(--green)',   bg: 'var(--green-bg)',   label: 'Sale' },
  refund:     { icon: RotateCcw,      color: 'var(--red)',     bg: 'var(--red-bg)',     label: 'Refund' },
  restock:    { icon: Package,        color: 'var(--accent3)', bg: 'var(--accent-bg)',  label: 'Restock' },
  adjustment: { icon: MinusCircle,    color: 'var(--orange)',  bg: 'var(--orange-bg)',  label: 'Adjustment' },
  usage:      { icon: ArrowDownRight, color: 'var(--text3)',   bg: 'var(--surface2)',   label: 'Usage' },
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMs / 3600000);
  const diffD   = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffH   < 24) return `${diffH}h ago`;
  if (diffD   < 7)  return `${diffD}d ago`;
  return d.toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleString('en-MY', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Mobile compact transaction row ──────────────────────────────────────── */
function MobileTxRow({ tx, onRefund }) {
  const { format } = useCurrency();
  const cfg   = TYPE_CONFIG[tx.type] || TYPE_CONFIG.usage;
  const Icon  = cfg.icon;
  const total = (tx.quantity || 0) * (tx.unit_price || 0);
  const isRefund = tx.type === 'refund';
  const isSale   = tx.type === 'sale';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
    }}>
      {/* Type icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 'var(--r-md)', flexShrink: 0,
        background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} style={{ color: cfg.color }} />
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }} className="truncate">
            {tx.item_name}
          </p>
          <p style={{
            fontWeight: 700, fontSize: 13, flexShrink: 0,
            color: isRefund ? 'var(--red)' : tx.type === 'sale' ? 'var(--green)' : 'var(--text)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isRefund ? '−' : ''}{format(total)}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
            background: cfg.bg, color: cfg.color,
          }}>{cfg.label}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            ×{tx.quantity} {tx.unit} @ {format(tx.unit_price)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>· {formatDate(tx.created_at)}</span>
        </div>
        {tx.note && (
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>
            {tx.note}
          </p>
        )}
      </div>

      {/* Refund button */}
      {isSale && (
        <button
          onClick={() => onRefund(tx)}
          style={{
            flexShrink: 0, width: 30, height: 30,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-md)',
            background: 'var(--red-bg)',
            color: 'var(--red)',
            border: '1px solid rgba(229,72,77,0.2)',
            cursor: 'pointer', transition: 'all 150ms',
          }}
          title="Process refund">
          <RotateCcw size={13} />
        </button>
      )}
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function TransactionList({ transactions, onRefundSuccess }) {
  const { format } = useCurrency();
  const [refundTx, setRefundTx] = useState(null);

  const handleRefundSuccess = () => {
    setRefundTx(null);
    onRefundSuccess?.();
  };

  if (!transactions?.length) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text3)' }}>
        <Receipt size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
        <p style={{ fontSize: 13 }}>No transactions yet</p>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE view (< 768px) ────────────────────────────────────── */}
      <div className="block md:hidden">
        {transactions.map(tx => (
          <MobileTxRow key={tx.id} tx={tx} onRefund={setRefundTx} />
        ))}
      </div>

      {/* ── DESKTOP view (≥ 768px) ───────────────────────────────────── */}
      <div className="hidden md:block">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                {['Type','Item','Qty','Price','Total','Date',''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const cfg   = TYPE_CONFIG[tx.type] || TYPE_CONFIG.usage;
                const Icon  = cfg.icon;
                const total = (tx.quantity || 0) * (tx.unit_price || 0);
                const isRefund = tx.type === 'refund';
                const isSale   = tx.type === 'sale';
                return (
                  <tr key={tx.id}>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: cfg.bg, color: cfg.color,
                      }}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                    </td>
                    <td>
                      <p style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>{tx.item_name}</p>
                      {tx.sku && <p style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'monospace' }}>{tx.sku}</p>}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text2)', fontSize: 13 }}>
                      {tx.quantity} {tx.unit}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text3)', fontSize: 13 }}>
                      {format(tx.unit_price)}
                    </td>
                    <td style={{
                      fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 13,
                      color: isRefund ? 'var(--red)' : isSale ? 'var(--green)' : 'var(--text)',
                    }}>
                      {isRefund ? '−' : ''}{format(total)}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text3)' }} title={formatDateFull(tx.created_at)}>
                      {formatDate(tx.created_at)}
                    </td>
                    <td>
                      {isSale && (
                        <button
                          onClick={() => setRefundTx(tx)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '4px 9px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                            background: 'var(--red-bg)', color: 'var(--red)',
                            border: '1px solid rgba(229,72,77,0.2)', cursor: 'pointer',
                            transition: 'all 150ms',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,72,77,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--red-bg)'}
                        >
                          <RotateCcw size={11} /> Refund
                        </button>
                      )}
                      {tx.type === 'refund' && tx.note && (
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>
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
      </div>

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
