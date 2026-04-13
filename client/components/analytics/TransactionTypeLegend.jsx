/**
 * TransactionTypeLegend Component
 * Explains different transaction types and their effects
 */

import React, { useState } from 'react';
import { HelpCircle, X, ShoppingCart, RotateCcw, Ban, PackagePlus, Settings, Package } from 'lucide-react';

const TransactionTypeLegend = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const transactionTypes = [
    {
      icon: ShoppingCart,
      color: '#22c55e',
      type: 'Sale',
      description: 'Items sold to customers',
      effect: 'Revenue ↑, Stock ↓',
      example: 'Customer buys 5 items at RM50 each → Revenue +RM250'
    },
    {
      icon: RotateCcw,
      color: '#f59e0b',
      type: 'Refund',
      description: 'Customer returns items',
      effect: 'Revenue ↓ (negative), Stock ↑',
      example: 'Customer returns 2 items → Revenue -RM100, Stock +2'
    },
    {
      icon: Ban,
      color: '#ef4444',
      type: 'Cancelled',
      description: 'Sale was voided/cancelled',
      effect: 'Excluded from all metrics',
      example: 'Original sale removed from reports as if it never happened'
    },
    {
      icon: PackagePlus,
      color: '#3b82f6',
      type: 'Restock',
      description: 'New inventory added',
      effect: 'No revenue impact, Stock ↑',
      example: 'Received 50 units from supplier → Stock +50'
    },
    {
      icon: Settings,
      color: '#8b5cf6',
      type: 'Adjustment',
      description: 'Stock count correction',
      effect: 'No revenue impact, Stock ±',
      example: 'Physical count shows 45 instead of 50 → Stock -5'
    },
    {
      icon: Package,
      color: '#6b7280',
      type: 'Usage',
      description: 'Internal use/consumption',
      effect: 'No revenue impact, Stock ↓',
      example: 'Used 3 items for display → Stock -3'
    }
  ];
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{ 
          background: 'var(--surface2)',
          color: 'var(--text2)',
          border: '1px solid var(--border)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface2)';
        }}
      >
        <HelpCircle size={16} />
        Understanding Revenue
      </button>
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                Understanding Your Revenue
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text2)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Why Revenue Can Be Negative */}
              <div 
                className="p-4 rounded-lg"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>
                  🤔 Why Can Revenue Be Negative?
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--text)' }}>
                  Your <strong>Net Revenue</strong> = Sales - Refunds. If refunds exceed sales, revenue becomes negative.
                </p>
                <div 
                  className="text-xs p-3 rounded"
                  style={{ background: 'var(--surface)', color: 'var(--text2)' }}
                >
                  <p className="mb-1"><strong>Example:</strong></p>
                  <p>• You sold RM1,000 worth of items</p>
                  <p>• Customers returned RM1,500 worth</p>
                  <p>• Net Revenue = RM1,000 - RM1,500 = <strong>-RM500</strong></p>
                </div>
              </div>
              
              {/* Transaction Types */}
              <div>
                <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>
                  📋 Transaction Types
                </h3>
                <div className="space-y-2">
                  {transactionTypes.map((tx) => (
                    <div 
                      key={tx.type}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                    >
                      <div 
                        className="p-2 rounded-lg flex-shrink-0"
                        style={{ background: `${tx.color}20` }}
                      >
                        <tx.icon size={18} style={{ color: tx.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
                            {tx.type}
                          </span>
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ 
                              background: `${tx.color}20`,
                              color: tx.color
                            }}
                          >
                            {tx.effect}
                          </span>
                        </div>
                        <p className="text-xs mb-1" style={{ color: 'var(--text2)' }}>
                          {tx.description}
                        </p>
                        <p className="text-xs italic" style={{ color: 'var(--text3)' }}>
                          {tx.example}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Cancelled vs Refund */}
              <div 
                className="p-4 rounded-lg"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
              >
                <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text)' }}>
                  ❓ Cancelled vs Refund
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="font-bold mb-1" style={{ color: '#ef4444' }}>Cancelled</p>
                    <ul className="space-y-1" style={{ color: 'var(--text2)' }}>
                      <li>• Sale never completed</li>
                      <li>• Excluded from all reports</li>
                      <li>• As if it never happened</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold mb-1" style={{ color: '#f59e0b' }}>Refund</p>
                    <ul className="space-y-1" style={{ color: 'var(--text2)' }}>
                      <li>• Sale was completed</li>
                      <li>• Subtracts from revenue</li>
                      <li>• Visible in reports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div 
              className="p-4 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
                style={{ 
                  background: 'var(--accent)',
                  color: 'white'
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransactionTypeLegend;
