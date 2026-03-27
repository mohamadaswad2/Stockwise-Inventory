/**
 * ItemTable — paginated table of inventory items with edit/delete actions.
 */
import { useState } from 'react';
import clsx from 'clsx';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../ui/ConfirmDialog';
import Spinner from '../ui/Spinner';
import EmptyState from '../ui/EmptyState';

function stockBadge(qty, threshold) {
  if (qty === 0)           return <span className="badge-red">Out of stock</span>;
  if (qty <= threshold)    return <span className="badge-yellow">Low stock</span>;
  return <span className="badge-green">In stock</span>;
}

export default function ItemTable({ items, total, loading, filters, setFilters, onEdit, onDelete }) {
  const [deletingItem, setDeletingItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const totalPages = Math.ceil(total / filters.limit);

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try { await onDelete(deletingItem.id); }
    finally { setDeleteLoading(false); setDeletingItem(null); }
  };

  if (loading) return (
    <div className="card flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );

  if (!items.length) return (
    <div className="card">
      <EmptyState
        title="No items found"
        description="Add your first inventory item to get started."
      />
    </div>
  );

  return (
    <>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'SKU', 'Category', 'Qty', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px]">
                    <p className="truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-slate-400 truncate">{item.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {item.sku || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {item.category_name || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-800">{item.quantity}</span>
                    <span className="text-slate-400 text-xs ml-1">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    ${Number(item.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {stockBadge(item.quantity, item.low_stock_threshold)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => onEdit(item)}
                        className="btn-ghost p-1.5 rounded-lg" title="Edit">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingItem(item)}
                        className="btn-ghost p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Showing {(filters.page - 1) * filters.limit + 1}–{Math.min(filters.page * filters.limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                className="btn-secondary py-1 px-2 text-xs"
                disabled={filters.page <= 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>
                <ChevronLeft size={14} />
              </button>
              <button
                className="btn-secondary py-1 px-2 text-xs"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete item?"
        description={`"${deletingItem?.name}" will be removed from your inventory. This action cannot be undone.`}
      />
    </>
  );
}
