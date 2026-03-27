/**
 * InventoryFilters — search bar + category filter + low stock toggle.
 * Categories adalah preset — user pilih je, tak boleh tambah sendiri.
 */
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function InventoryFilters({ filters, setFilters, categories }) {
  const [search, setSearch] = useState(filters.search || '');
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search, page: 1 }));
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="Cari nama atau SKU…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Category filter dropdown — preset categories sahaja */}
      <select
        className="input w-auto min-w-[160px]"
        value={filters.category_id || ''}
        onChange={e => setFilters(f => ({ ...f, category_id: e.target.value || undefined, page: 1 }))}>
        <option value="">Semua kategori</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      {/* Low stock toggle */}
      <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 select-none">
        <input
          type="checkbox"
          className="accent-sky-500 w-4 h-4"
          checked={!!filters.low_stock}
          onChange={e => setFilters(f => ({ ...f, low_stock: e.target.checked || undefined, page: 1 }))}
        />
        Stok rendah sahaja
      </label>
    </div>
  );
}
