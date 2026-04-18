/**
 * InventoryFilters — category + low stock toggle only.
 * Search is handled by the sticky search bar in inventory/index.jsx.
 * Removed duplicate search input to fix competing filter bug.
 */
export default function InventoryFilters({ filters, setFilters, categories }) {
  const hasFilters = categories?.length > 0;
  if (!hasFilters) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Category */}
      {categories?.length > 0 && (
        <select
          className="input"
          style={{ width: 'auto', minWidth: 150, height: 36, fontSize: 13 }}
          value={filters.category_id || ''}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {/* Low stock toggle */}
      <button
        onClick={() => setFilters(f => ({ ...f, low_stock: !f.low_stock || undefined, page: 1 }))}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '0 12px', height: 36, borderRadius: 'var(--r-md)',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: filters.low_stock ? 'var(--orange-bg)' : 'var(--surface2)',
          color:      filters.low_stock ? 'var(--orange)'    : 'var(--text3)',
          border: `1px solid ${filters.low_stock ? 'rgba(247,107,21,0.25)' : 'var(--border)'}`,
          transition: 'all 150ms ease',
        }}>
        {filters.low_stock ? '⚠️' : '📦'} Low stock only
      </button>

      {/* Clear filters */}
      {(filters.category_id || filters.low_stock) && (
        <button
          onClick={() => setFilters(f => ({ ...f, category_id: undefined, low_stock: undefined, page: 1 }))}
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--text3)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 4px', textDecoration: 'underline',
          }}>
          Clear
        </button>
      )}
    </div>
  );
}
