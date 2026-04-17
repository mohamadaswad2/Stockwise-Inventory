import { useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Plus, Download, Lock, RefreshCw, AlertCircle, Search, SlidersHorizontal } from 'lucide-react';
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

        {/* ── Sticky header bar ──────────────────────────────────────── */}
        <div className="sticky-bar" style={{ paddingBottom: 0 }}>
          {/* Top row: title + CTA buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
            <div>
              <h1 className="page-title">Inventory</h1>
              <p className="page-subtitle">{total} item{total !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {/* Export — icon only on mobile */}
              <button onClick={handleExportCSV} disabled={exporting}
                className="btn-secondary"
                style={{ padding: '0 12px', height: 36, fontSize: 13 }}
                title={canExport ? 'Export CSV' : 'Upgrade to export CSV'}>
                {canExport ? <Download size={14} /> : <Lock size={14} />}
                <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export'}</span>
              </button>
              {/* Filter toggle — mobile */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="btn-secondary sm:hidden"
                style={{ padding: '0 12px', height: 36 }}
                aria-label="Filters">
                <SlidersHorizontal size={14} />
              </button>
              <button onClick={() => setCreateOpen(true)} className="btn-primary"
                style={{ height: 36, paddingLeft: 14, paddingRight: 14, fontSize: 13 }}>
                <Plus size={15} /> <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>

          {/* Search bar — always visible */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)', color: 'var(--text3)',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              className="input"
              placeholder="Search items, SKU…"
              value={filters.search || ''}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
              style={{ paddingLeft: 36, height: 38, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Upgrade notice */}
        {!canExport && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 'var(--r-md)', marginBottom: 10,
            background: 'var(--orange-bg)',
            border: '1px solid rgba(247,107,21,0.2)',
            fontSize: 12, color: 'var(--orange)', fontWeight: 500,
          }}>
            <Lock size={12} /> CSV export available on Starter plan and above.
          </div>
        )}

        {/* Filters — desktop always, mobile collapsible */}
        <div className={`${showFilters ? 'block' : 'hidden sm:block'} mb-3`}>
          <InventoryFilters filters={filters} setFilters={setFilters} categories={categories} />
        </div>

        {/* Error state */}
        {error && !loading && (
          <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 12 }}>
            <AlertCircle size={28} style={{ color: 'var(--red)', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>{error}</p>
            <button onClick={refetch} className="btn-secondary" style={{ fontSize: 13, gap: 6 }}>
              <RefreshCw size={13} /> Try Again
            </button>
          </div>
        )}

        {/* Table */}
        {!error && (
          <div className="animate-ios-in">
            <ItemTable
              items={items} total={total} loading={loading}
              filters={filters} setFilters={setFilters}
              onEdit={setEditItem}
              onDelete={deleteItem}
              onQuickSell={setQuickSellItem}
              onRestock={setRestockItem}
            />
          </div>
        )}

        {/* Modals */}
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
