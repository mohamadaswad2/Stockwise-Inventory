export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-[3px]' };
  return (
    <div className={`animate-spin rounded-full ${s[size]} ${className}`}
      style={{ borderColor: 'var(--surface3)', borderTopColor: 'var(--accent)' }} />
  );
}
