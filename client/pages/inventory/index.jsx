/**
 * /inventory — Full inventory management page with CRUD modals.
 */
import { useState } from 'react';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import ProtectedRoute from '../../components/layout/ProtectedRoute';
import AppLayout from '../../components/layout/AppLayout';
import ItemTable from '../../components/inventory/ItemTable';
import ItemForm from '../../components/inventory/ItemForm';
import InventoryFilters from '../../components/inventory/InventoryFilters';
import Modal from '../../components/ui/Modal';
import { useInventory } from '../../hooks/useInventory';
import { useCategories } from '../../hooks/useCategories';
import * as inventoryService from '../../services/inventory.service';

export default function InventoryPage() {
  const { items, total, loading, filters, setFilters, refetch, deleteItem } = useInventory();
  const { categories } = useCategories();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem,   setEditItem]   = useState(null);
  const [saving,     setSaving]     = useState(false);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await inventoryService.createItem(data);
      toast.success('Item created!');
      setCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create item.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data) => {
    setSaving(true);
    try {
      await inventoryService.updateItem(editItem.id, data);
      toast.success('Item updated!');
      setEditItem(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update item.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppLayout>
        <Head><title>Inventory — StockWise</title></Head>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Inventory</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {total} item{total !== 1 ? 's' : ''} total
            </p>
          </div>
          <button className="btn-primary flex-shrink-0" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <InventoryFilters filters={filters} setFilters={setFilters} categories={categories} />
        </div>

        {/* Table */}
        <ItemTable
          items={items}
          total={total}
          loading={loading}
          filters={filters}
          setFilters={setFilters}
          onEdit={setEditItem}
          onDelete={deleteItem}
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
                quantity: String(editItem.quantity),
                price:    String(editItem.price),
                low_stock_threshold: String(editItem.low_stock_threshold),
                category_id: editItem.category_id || '',
              }}
              categories={categories}
              onSubmit={handleUpdate}
              loading={saving}
            />
          )}
        </Modal>
      </AppLayout>
    </ProtectedRoute>
  );
}
