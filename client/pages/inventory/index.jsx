import { useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Plus, Download, Lock } from 'lucide-react';
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
  const { user } = useAuth();
  const { items, total, loading, filters, setFilters, refetch, deleteItem } = useInventory();
  const { categories } = useCategories();

  const [createOpen,    setCreateOpen]    = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [quickSellItem, setQuickSellItem] = useState(null);
  const [restockItem,   setRestockItem]   = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [exporting,     setExporting]     = useState(false);

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
      toast.success('Item updated!');
      setEditItem(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update.');
    } finally { setSaving(false); }
  };

  const handleExportCSV = async () => {
    if (!canExport) {
      toast.error('CSV export requires Starter plan or above.');
      return;
    }
    setExporting(true);
    try {
      const res  = await inventoryService.exportCSV();
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `stockwise-${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
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

        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Inventory</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text2)' }}>{total} item{total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV} disabled={exporting}
              className="btn-secondary text-sm flex items-center gap-2"
              title={canExport ? 'Export CSV' : 'Upgrade to export CSV'}>
              {canExport ? <Download size={14} /> : <Lock size={14} />}
              <span className="hidden sm:inline">{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </button>
            <button className="btn-primary" onClick={() => setCreateOpen(true)}>
              <Plus size={15} /> Add Item
            </button>
          </div>
        </div>

        {/* Plan notice */}
        {!canExport && (
          <div className="mb-3 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: 'var(--orange)' }}>
            <Lock size={12} /> CSV Export available on Starter plan and above.
          </div>
        )}

        {/* Filters */}
        <div className="mb-4">
          <InventoryFilters filters={filters} setFilters={setFilters} categories={categories} />
        </div>

        {/* Table */}
        <ItemTable
          items={items} total={total} loading={loading}
          filters={filters} setFilters={setFilters}
          onEdit={setEditItem}
          onDelete={deleteItem}
          onQuickSell={setQuickSellItem}
          onRestock={setRestockItem}
        />

        {/* Create modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add New Item" size="lg">
          <ItemForm categories={categories} onSubmit={handleCreate} loading={saving} />
        </Modal>

        {/* Edit modal */}
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

        {/* Quick Sell modal */}
        {quickSellItem && (
          <QuickSellModal
            item={quickSellItem}
            onClose={() => setQuickSellItem(null)}
            onSuccess={refetch}
          />
        )}

        {/* Restock modal */}
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
