import { Plus } from 'lucide-react';

export default function FloatingActionButton({ onClick, disabled = false, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title="Record Quick Sale"
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
        boxShadow: '0 4px 20px var(--glow), 0 2px 4px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        zIndex: 1000,
        opacity: disabled || loading ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 24px var(--glow-strong), 0 3px 6px rgba(0,0,0,0.2)';
        }
      }}
      onMouseLeave={e => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px var(--glow), 0 2px 4px rgba(0,0,0,0.2)';
        }
      }}
      onMouseDown={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.95)'; }}
      onMouseUp={e => { if (!disabled && !loading) e.currentTarget.style.transform = 'scale(1.1)'; }}
    >
      {loading ? (
        <div style={{
          width: '20px', height: '20px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid white',
          borderRadius: '50%',
          animation: 'fabSpin 1s linear infinite',
          pointerEvents: 'none',
        }} />
      ) : (
        <Plus size={24} color="white" strokeWidth={2.5} style={{ pointerEvents: 'none' }} />
      )}
    </button>
  );
}
