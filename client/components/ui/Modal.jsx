/**
 * Modal — responsive, works on mobile.
 * Bottom sheet on mobile, centered on desktop.
 */
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (open) {
      document.addEventListener('keydown', h);
      // Prevent body scroll on mobile when modal open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />
      <div className={`relative w-full ${widths[size]} rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          maxHeight: '92dvh', // Use dvh for mobile browser chrome
          display: 'flex',
          flexDirection: 'column',
        }}>
        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface3)' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-xl flex-shrink-0"><X size={15}/></button>
        </div>
        {/* Scrollable content */}
        <div className="px-5 py-5 overflow-y-auto flex-1 -webkit-overflow-scrolling-touch">
          {children}
        </div>
      </div>
    </div>
  );
}
