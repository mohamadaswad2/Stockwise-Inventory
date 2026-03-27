import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />
      <div className={`relative w-full ${widths[size]} rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up`}
        style={{ background: 'var(--ios-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--ios-separator)' }} />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 sticky top-0"
          style={{ borderBottom: '1px solid var(--ios-separator)', background: 'var(--ios-surface)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--ios-text)' }}>{title}</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8 rounded-xl"><X size={16} /></button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
