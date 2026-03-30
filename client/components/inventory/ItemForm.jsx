/**
 * ItemForm — FIXED:
 * - Input focus loss fixed (no inline components that remount)
 * - SKU set to empty string properly (backend converts to null)
 */
import { useState, useCallback } from 'react';

const UNITS = ['unit','pcs','kg','g','l','ml','box','pack','roll','set'];

const EMPTY = {
  name:'', sku:'', description:'', quantity:'',
  unit:'pcs', price:'', cost_price:'', low_stock_threshold:'5', category_id:''
};

export default function ItemForm({ initialData = {}, categories = [], onSubmit, loading }) {
  const [form,   setForm]   = useState({ ...EMPTY, ...initialData });
  const [errors, setErrors] = useState({});

  // useCallback prevents function recreation on every render — fixes focus loss
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())          errs.name     = 'Name is required.';
    if (form.quantity === '')        errs.quantity = 'Quantity is required.';
    if (Number(form.quantity) < 0)  errs.quantity = 'Cannot be negative.';
    if (form.price === '')           errs.price    = 'Price is required.';
    if (Number(form.price) < 0)     errs.price    = 'Cannot be negative.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit({
      name:                form.name.trim(),
      sku:                 form.sku.trim() || null,
      description:         form.description.trim() || null,
      quantity:            Number(form.quantity),
      unit:                form.unit,
      price:               Number(form.price),
      cost_price:          Number(form.cost_price) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      category_id:         form.category_id || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="name">Item Name *</label>
          <input id="name" name="name" type="text" autoComplete="off"
            className="input" placeholder="Wireless Mouse"
            value={form.name} onChange={handleChange} required />
          {errors.name && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="sku">SKU</label>
          <input id="sku" name="sku" type="text" autoComplete="off"
            className="input" placeholder="MSE-001"
            value={form.sku} onChange={handleChange} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2}
          className="input resize-none" placeholder="Optional description…"
          value={form.description} onChange={handleChange} />
      </div>

      {/* Row 2 — numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="label" htmlFor="quantity">Quantity *</label>
          <input id="quantity" name="quantity" type="number" min="0"
            className="input" placeholder="0"
            value={form.quantity} onChange={handleChange} required />
          {errors.quantity && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.quantity}</p>}
        </div>
        <div>
          <label className="label" htmlFor="unit">Unit</label>
          <select id="unit" name="unit" className="input"
            value={form.unit} onChange={handleChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="price">Sell Price *</label>
          <input id="price" name="price" type="number" min="0" step="0.01"
            className="input" placeholder="0.00"
            value={form.price} onChange={handleChange} required />
          {errors.price && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.price}</p>}
        </div>
        <div>
          <label className="label" htmlFor="cost_price">Cost Price</label>
          <input id="cost_price" name="cost_price" type="number" min="0" step="0.01"
            className="input" placeholder="0.00"
            value={form.cost_price} onChange={handleChange} />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="low_stock_threshold">Low Stock Alert</label>
          <input id="low_stock_threshold" name="low_stock_threshold" type="number" min="0"
            className="input" placeholder="5"
            value={form.low_stock_threshold} onChange={handleChange} />
        </div>
        <div>
          <label className="label" htmlFor="category_id">Category</label>
          <select id="category_id" name="category_id" className="input"
            value={form.category_id} onChange={handleChange}>
            <option value="">— None —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save Item'}
        </button>
      </div>
    </form>
  );
}
