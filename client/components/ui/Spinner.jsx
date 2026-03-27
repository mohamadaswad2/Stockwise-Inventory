export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3' };
  return (
    <div className={`animate-spin rounded-full ${s[size]} ${className}`}
      style={{ borderColor: 'var(--ios-separator)', borderTopColor: 'var(--ios-blue)' }} />
  );
}
