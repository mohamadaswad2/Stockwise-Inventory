/**
 * FloatingActionButton - Always-visible quick action button
 * Positioned bottom-right for easy access
 */
import React from 'react';
import { Plus } from 'lucide-react';

const FloatingActionButton = ({ onClick, disabled = false, loading = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="floating-action-button"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 12px rgba(99,102,241,0.3), 0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        zIndex: 1000,
        opacity: disabled || loading ? 0.6 : 1,
        transform: disabled || loading ? 'scale(0.95)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 16px rgba(99,102,241,0.4), 0 3px 6px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3), 0 2px 4px rgba(0,0,0,0.1)';
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'scale(0.95)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.target.style.transform = 'scale(1.1)';
        }
      }}
      title="Record Quick Sale"
    >
      {loading ? (
        <div 
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
      ) : (
        <Plus 
          size={24} 
          color="white" 
          strokeWidth={2.5}
        />
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .floating-action-button:active {
          transform: scale(0.95) !important;
        }
      `}</style>
    </button>
  );
};

export default FloatingActionButton;
