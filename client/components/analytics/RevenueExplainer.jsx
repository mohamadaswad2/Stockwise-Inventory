/**
 * RevenueExplainer Component
 * Helps users understand why revenue might be negative or lower than expected
 */

import React from 'react';
import { AlertCircle, Info, TrendingDown, ArrowLeftRight, Ban } from 'lucide-react';

const RevenueExplainer = ({ summary }) => {
  const revenue = summary?.revenue_period || 0;
  const refunds = summary?.total_refunds || 0;
  const grossSales = summary?.gross_revenue || 0;
  
  // Calculate if there are significant refunds
  const refundRate = grossSales > 0 ? (refunds / grossSales) * 100 : 0;
  const hasSignificantRefunds = refundRate > 10;
  const isNegativeRevenue = revenue < 0;
  
  if (!hasSignificantRefunds && !isNegativeRevenue) return null;
  
  return (
    <div className="mb-4">
      {isNegativeRevenue && (
        <div 
          className="p-4 rounded-lg border-l-4 mb-3"
          style={{ 
            background: 'rgba(239,68,68,0.08)', 
            borderColor: 'var(--red)',
            border: '1px solid rgba(239,68,68,0.15)'
          }}
        >
          <div className="flex items-start gap-3">
            <TrendingDown size={20} style={{ color: 'var(--red)', flexShrink: 0 }} />
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--red)' }}>
                ⚠️ Revenue is Negative
              </p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                Your refunds (RM{refunds.toFixed(2)}) exceed your sales (RM{grossSales.toFixed(2)}) in this period.
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--text2)' }}>
                Net Revenue = Sales - Refunds = RM{revenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {hasSignificantRefunds && !isNegativeRevenue && (
        <div 
          className="p-4 rounded-lg border-l-4"
          style={{ 
            background: 'rgba(245,158,11,0.08)', 
            borderColor: 'var(--orange)',
            border: '1px solid rgba(245,158,11,0.15)'
          }}
        >
          <div className="flex items-start gap-3">
            <ArrowLeftRight size={20} style={{ color: 'var(--orange)', flexShrink: 0 }} />
            <div>
              <p className="font-bold text-sm mb-1" style={{ color: 'var(--orange)' }}>
                💡 Refunds Affecting Revenue
              </p>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                You have <strong>{refundRate.toFixed(1)}%</strong> refund rate in this period.
              </p>
              <div className="text-xs mt-2 space-y-1" style={{ color: 'var(--text2)' }}>
                <p>• Gross Sales: RM{grossSales.toFixed(2)}</p>
                <p>• Refunds: -RM{refunds.toFixed(2)}</p>
                <p>• Net Revenue: RM{revenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueExplainer;
