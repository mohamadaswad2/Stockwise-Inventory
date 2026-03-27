import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        onClick={onClose} />
      <div className="relative w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--ios-surface)' }}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--ios-separator)' }} />
        </div>
        <div className="px-6 py-6 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,59,48,0.1)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--ios-red)' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: 'var(--ios-text)' }}>{title}</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--ios-text2)' }}>{description}</p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="btn-secondary flex-1">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1">
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
