/**
 * ItemForm — shared form for creating and editing inventory items.
 * Used inside a modal. Accepts initialData for edit mode.
 */
import { useState } from 'react';
import { Save } from 'lucide-react';

const UNITS = ['unit', 'pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'roll', 'set'];

const EMPTY = {
  name: '', sku: '', description: '', quantity: '',
  unit: 'pcs', price: '', low_stock_threshold: '5', category_id: '',
};

export default function ItemForm({ initialData = {}, categories = [], onSubmit, loading }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialData });
  const [errors, setErrors] = useState({});

  const set = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(e => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())         errs.name     = 'Name is required.';
    if (form.quantity === '')       errs.quantity = 'Quantity is required.';
    if (Number(form.quantity) < 0) errs.quantity = 'Quantity cannot be negative.';
    if (form.price === '')          errs.price    = 'Price is required.';
    if (Number(form.price) < 0)    errs.price    = 'Price cannot be negative.';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSubmit({
      ...form,
      quantity:            Number(form.quantity),
      price:               Number(form.price),
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      category_id:         form.category_id || null,
      sku:                 form.sku || null,
    });
  };

  const field = (label, name, props = {}) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="input" value={form[name]} onChange={set} {...props} />
      {errors[name] && <p className="text-xs text-red-500 mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Item Name *', 'name', { placeholder: 'Wireless Mouse', required: true })}
        {field('SKU', 'sku', { placeholder: 'MSE-001' })}
      </div>

      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={2}
          className="input resize-none" placeholder="Optional description…"
          value={form.description} onChange={set} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {field('Quantity *', 'quantity', { type: 'number', min: 0, placeholder: '0' })}
        <div>
          <label className="label" htmlFor="unit">Unit</label>
          <select id="unit" name="unit" className="input" value={form.unit} onChange={set}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {field('Price (RM) *', 'price', { type: 'number', min: 0, step: '0.01', placeholder: '0.00' })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {field('Low Stock Threshold', 'low_stock_threshold', { type: 'number', min: 0, placeholder: '5' })}
        <div>
          <label className="label" htmlFor="category_id">Category</label>
          <select id="category_id" name="category_id" className="input" value={form.category_id} onChange={set}>
            <option value="">— None —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          <Save size={15} />
          {loading ? 'Saving…' : 'Save Item'}
        </button>
      </div>
    </form>
  );
}
