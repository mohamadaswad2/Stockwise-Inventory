import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export default function InventoryFilters({ filters, setFilters, categories }) {
  const [search, setSearch] = useState(filters.search || '');
  const debounce = useRef(null);

  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setFilters(f => ({ ...f, search, page: 1 }));
    }, 400);
    return () => clearTimeout(debounce.current);
  }, [search]);

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text3)' }} />
        <input className="input pl-9 text-sm" placeholder="Search name or SKU…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {categories?.length > 0 && (
        <select className="input w-auto min-w-[160px] text-sm"
          value={filters.category_id || ''}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      <label className="flex items-center gap-2 cursor-pointer select-none px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
        style={{
          background: filters.low_stock ? 'rgba(245,158,11,0.1)' : 'var(--surface2)',
          color: filters.low_stock ? 'var(--orange)' : 'var(--text2)',
          border: `1px solid ${filters.low_stock ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
        }}>
        <input type="checkbox" className="w-4 h-4" style={{ accentColor: 'var(--orange)' }}
          checked={!!filters.low_stock}
          onChange={e => setFilters(f => ({ ...f, low_stock: e.target.checked || undefined, page: 1 }))} />
        Low stock only
      </label>
    </div>
  );
}
