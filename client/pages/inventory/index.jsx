import { useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import {
  Plus, Download, Lock, RefreshCw, AlertCircle,
  Search, SlidersHorizontal, X,
} from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import ItemTable from '../../components/inventory/ItemTable';
import ItemForm from '../../components/inventory/ItemForm';
import InventoryFilters from '../../components/inventory/InventoryFilters';
import QuickSellModal from '../../components/inventory/QuickSellModal';
import RestockModal from '../../components/inventory/RestockModal';
import Modal from '../../components/ui/Modal';
import { useInventory } from '../../hooks/useInventory';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../contexts/AuthContext';
import * as inventoryService from '../../services/inventory.service';

const EXPORT_PLANS = ['starter', 'premium', 'deluxe'];

export default function InventoryPage() {
  const { user }  = useAuth();
  const { items, total, loading, error, filters, setFilters, refetch, deleteItem } = useInventory();
  const { categories } = useCategories();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [quickSellItem, setQuickSellItem] = useState(null);
  const [restockItem,   setRestockItem]   = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [showFilters,   setShowFilters]   = useState(false);

  const canExport = EXPORT_PLANS.includes(user?.plan);
  const hasActiveFilters = !!(filters.category_id || filters.low_stock);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await inventoryService.createItem(data);
      toast.success('Item created!');
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create item.');
    } finally { setSaving(false); }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await inventoryService.updateItem(editItem.id, data);
      toast.success('Updated!');
      setEditItem(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally { setSaving(false); }
  };

  const handleExportCSV = async () => {
    if (!canExport) { toast.error('CSV export requires Starter plan or above.'); return; }
    setExporting(true);
    try {
      const res  = await inventoryService.exportCSV();
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `stockwise-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed.');
    } finally { setExporting(false); }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Inventory — StockWise</title></Head>

        {/* ── Top bar: title + actions ─────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 10 }}>
          <div>
            <h1 className="page-title">Inventory</h1>
            <p className="page-subtitle">{total} item{total !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={handleExportCSV} disabled={exporting}
              className="btn-secondary"
              style={{ height: 36, paddingLeft: 12, paddingRight: 12, fontSize: 13, gap: 6 }}
              title={canExport ? 'Export CSV' : 'Upgrade to export'}>
              {canExport ? <Download size={14} /> : <Lock size={14} />}
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
            </button>
            <button onClick={() => setCreateOpen(true)} className="btn-primary"
              style={{ height: 36, paddingLeft: 14, paddingRight: 14, fontSize: 13, gap: 6 }}>
              <Plus size={15} />
              <span className="hidden sm:inline">Add Item</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* ── Search + filter row ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          {/* Single search input — the only search box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{
              position: 'absolute', left: 11, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text3)',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              className="input"
              placeholder="Search items or SKU…"
              value={filters.search || ''}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 34, height: 36, fontSize: 13 }}
            />
            {filters.search && (
              <button
                onClick={() => setFilters(f => ({ ...f, search: '', page: 1 }))}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                  color: 'var(--text3)', display: 'flex', alignItems: 'center',
                }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(v => !v)}
            style={{
              height: 36, paddingLeft: 12, paddingRight: 12,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              borderRadius: 'var(--r-md)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: (showFilters || hasActiveFilters) ? 'var(--accent-bg)' : 'var(--surface2)',
              color:      (showFilters || hasActiveFilters) ? 'var(--accent3)'  : 'var(--text3)',
              border: `1px solid ${(showFilters || hasActiveFilters) ? 'var(--accent-border)' : 'var(--border)'}`,
              transition: 'all 150ms ease', flexShrink: 0,
            }}>
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span style={{
                width: 16, height: 16, borderRadius: '50%', background: 'var(--accent3)',
                color: '#fff', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>!</span>
            )}
          </button>
        </div>

        {/* ── Filter panel (collapsible) ────────────────────────────── */}
        {showFilters && (
          <div className="animate-slide-up" style={{ marginBottom: 12 }}>
            <InventoryFilters filters={filters} setFilters={setFilters} categories={categories} />
          </div>
        )}

        {/* ── Upgrade notice ────────────────────────────────────────── */}
        {!canExport && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 'var(--r-md)', marginBottom: 12,
            background: 'var(--orange-bg)', border: '1px solid rgba(247,107,21,0.2)',
            fontSize: 12, color: 'var(--orange)', fontWeight: 500,
          }}>
            <Lock size={12} /> CSV export is available on Starter plan and above.
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────── */}
        {error && !loading && (
          <div className="card" style={{ padding: '28px 20px', textAlign: 'center', marginBottom: 12 }}>
            <AlertCircle size={28} style={{ color: 'var(--red)', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>{error}</p>
            <button onClick={refetch} className="btn-secondary" style={{ fontSize: 13, gap: 6 }}>
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        )}

        {/* ── Table ────────────────────────────────────────────────── */}
        {!error && (
          <ItemTable
            items={items} total={total} loading={loading}
            filters={filters} setFilters={setFilters}
            onEdit={setEditItem}
            onDelete={deleteItem}
            onQuickSell={setQuickSellItem}
            onRestock={setRestockItem}
          />
        )}

        {/* ── Modals ───────────────────────────────────────────────── */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Item" size="lg">
          <ItemForm categories={categories} onSubmit={handleCreate} loading={saving} />
        </Modal>

        <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Item" size="lg">
          {editItem && (
            <ItemForm
              initialData={{
                ...editItem,
                quantity:            String(editItem.quantity),
                price:               String(editItem.price),
                cost_price:          String(editItem.cost_price || 0),
                low_stock_threshold: String(editItem.low_stock_threshold),
                category_id:         editItem.category_id || '',
              }}
              categories={categories}
              onSubmit={handleUpdate}
              loading={saving}
            />
          )}
        </Modal>

        {quickSellItem && (
          <QuickSellModal
            item={quickSellItem}
            onClose={() => setQuickSellItem(null)}
            onSuccess={refetch}
          />
        )}

        {restockItem && (
          <RestockModal
            item={restockItem}
            onClose={() => setRestockItem(null)}
            onSuccess={refetch}
          />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
