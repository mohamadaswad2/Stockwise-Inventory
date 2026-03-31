/**
 * ItemForm — FIXED for mobile:
 * - useCallback + stable refs prevent focus loss
 * - onSubmit properly called via button click
 * - Responsive grid for all screen sizes
 */
import { useState, useCallback, useRef } from 'react';

const UNITS = ['unit','pcs','kg','g','l','ml','box','pack','roll','set'];
const EMPTY = { name:'', sku:'', description:'', quantity:'', unit:'pcs', price:'', cost_price:'', low_stock_threshold:'5', category_id:'' };

export default function ItemForm({ initialData = {}, categories = [], onSubmit, loading }) {
  const [form,   setForm]   = useState({ ...EMPTY, ...initialData });
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  }, [errors]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim())          errs.name     = 'Name is required.';
    if (form.quantity === '')        errs.quantity = 'Quantity is required.';
    if (Number(form.quantity) < 0)  errs.quantity = 'Cannot be negative.';
    if (form.price === '')           errs.price    = 'Price is required.';
    if (Number(form.price) < 0)     errs.price    = 'Cannot be negative.';
    return errs;
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
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
  }, [form, onSubmit]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Name + SKU */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-name">Item Name *</label>
          <input id="f-name" name="name" type="text" autoComplete="off"
            inputMode="text" className="input" placeholder="e.g. Wireless Mouse"
            value={form.name} onChange={handleChange} required />
          {errors.name && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.name}</p>}
        </div>
        <div>
          <label className="label" htmlFor="f-sku">SKU</label>
          <input id="f-sku" name="sku" type="text" autoComplete="off"
            className="input" placeholder="e.g. MSE-001"
            value={form.sku} onChange={handleChange} />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="label" htmlFor="f-desc">Description</label>
        <textarea id="f-desc" name="description" rows={2}
          className="input resize-none" placeholder="Optional…"
          value={form.description} onChange={handleChange} />
      </div>

      {/* Qty + Unit + Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-qty">Quantity *</label>
          <input id="f-qty" name="quantity" type="number" min="0"
            inputMode="numeric" className="input" placeholder="0"
            value={form.quantity} onChange={handleChange} required />
          {errors.quantity && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.quantity}</p>}
        </div>
        <div>
          <label className="label" htmlFor="f-unit">Unit</label>
          <select id="f-unit" name="unit" className="input"
            value={form.unit} onChange={handleChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-price">Sell Price *</label>
          <input id="f-price" name="price" type="number" min="0" step="0.01"
            inputMode="decimal" className="input" placeholder="0.00"
            value={form.price} onChange={handleChange} required />
          {errors.price && <p className="text-xs mt-1" style={{color:'var(--red)'}}>{errors.price}</p>}
        </div>
        <div>
          <label className="label" htmlFor="f-cost">Cost Price</label>
          <input id="f-cost" name="cost_price" type="number" min="0" step="0.01"
            inputMode="decimal" className="input" placeholder="0.00"
            value={form.cost_price} onChange={handleChange} />
        </div>
      </div>

      {/* Threshold + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="f-threshold">Low Stock Alert</label>
          <input id="f-threshold" name="low_stock_threshold" type="number" min="0"
            inputMode="numeric" className="input" placeholder="5"
            value={form.low_stock_threshold} onChange={handleChange} />
        </div>
        <div>
          <label className="label" htmlFor="f-category">Category</label>
          <select id="f-category" name="category_id" className="input"
            value={form.category_id} onChange={handleChange}>
            <option value="">— None —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Submit — large tap target for mobile */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          style={{ minHeight: '48px', fontSize: '15px' }}>
          {loading ? 'Saving…' : 'Save Item'}
        </button>
      </div>
    </form>
  );
}
