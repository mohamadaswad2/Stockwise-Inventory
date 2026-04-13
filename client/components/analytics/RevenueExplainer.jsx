/**
 * RevenueExplainer Component - Simplified
 * Shows brief, actionable alerts only when needed
 * Progressive disclosure: brief message → click for details
 */

import React, { useState } from 'react';
import { TrendingDown, ChevronDown, ChevronUp, Info } from 'lucide-react';

const RevenueExplainer = ({ summary }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const revenue = summary?.revenue_period || 0;
  const refunds = summary?.total_refunds || 0;
  const grossSales = summary?.gross_revenue || 0;
  
  // Only show when there's an actual issue
  const isNegative = revenue < 0;
  const hasHighRefunds = grossSales > 0 && (refunds / grossSales) > 0.15; // >15%
  
  // Don't render if everything is normal
  if (!isNegative && !hasHighRefunds) return null;
  
  const refundRate = grossSales > 0 ? Math.round((refunds / grossSales) * 100) : 0;
  
  // Simplified, actionable messages
  const getMessage = () => {
    if (isNegative) {
      return {
        type: 'negative',
        brief: `Refunds (RM${Number(refunds).toLocaleString('en-MY', {maximumFractionDigits: 0})}) exceeded sales this period`,
        action: 'Review recent returns',
        color: 'var(--red)',
        bg: 'rgba(239,68,68,0.06)'
      };
    }
    return {
      type: 'high-refunds',
      brief: `High return rate: ${refundRate}% of sales`,
      action: 'Check product quality',
      color: 'var(--orange)',
      bg: 'rgba(245,158,11,0.06)'
    };
  };
  
  const msg = getMessage();
  
  return (
    <div 
      className="mb-4 rounded-lg p-3 cursor-pointer transition-colors"
      style={{ background: msg.bg, border: `1px solid ${msg.color}20` }}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Brief message - always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} style={{ color: msg.color }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {msg.brief}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ background: `${msg.color}20`, color: msg.color }}
          >
            {msg.action}
          </span>
          {showDetails ? <ChevronUp size={16} style={{ color: 'var(--text2)' }} /> 
                       : <ChevronDown size={16} style={{ color: 'var(--text2)' }} />}
        </div>
      </div>
      
      {/* Expanded details - only when clicked */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: `${msg.color}20` }}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p style={{ color: 'var(--text3)' }}>Sales</p>
              <p className="font-medium" style={{ color: 'var(--text)' }}>
                RM{Number(grossSales).toLocaleString('en-MY', {minimumFractionDigits: 0, maximumFractionDigits: 2})}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text3)' }}>Refunds</p>
              <p className="font-medium" style={{ color: 'var(--red)' }}>
                -RM{Number(refunds).toLocaleString('en-MY', {minimumFractionDigits: 0, maximumFractionDigits: 2})}
              </p>
            </div>
            <div>
              <p style={{ color: 'var(--text3)' }}>Net Result</p>
              <p className="font-medium" style={{ color: revenue < 0 ? 'var(--red)' : 'var(--text)' }}>
                RM{Number(revenue).toLocaleString('en-MY', {minimumFractionDigits: 0, maximumFractionDigits: 2})}
              </p>
            </div>
          </div>
          <p className="mt-2" style={{ color: 'var(--text2)' }}>
            Net Revenue = Sales minus Refunds. Negative means more returns than new sales.
          </p>
        </div>
      )}
    </div>
  );
};

export default RevenueExplainer;
