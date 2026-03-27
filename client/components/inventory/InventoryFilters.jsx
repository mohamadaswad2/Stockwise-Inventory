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
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ios-text3)' }} />
        <input className="input pl-9" placeholder="Search name or SKU…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category */}
      {categories?.length > 0 && (
        <select className="input w-auto min-w-[160px]"
          value={filters.category_id || ''}
          onChange={e => setFilters(f => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {/* Low stock toggle */}
      <label className="flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-2xl text-sm font-medium select-none"
        style={{ background: filters.low_stock ? 'rgba(255,59,48,0.1)' : 'var(--ios-surface2)',
                 color: filters.low_stock ? 'var(--ios-red)' : 'var(--ios-text2)' }}>
        <input type="checkbox" className="w-4 h-4 accent-red-500"
          checked={!!filters.low_stock}
          onChange={e => setFilters(f => ({ ...f, low_stock: e.target.checked || undefined, page: 1 }))} />
        Low stock only
      </label>
    </div>
  );
}
