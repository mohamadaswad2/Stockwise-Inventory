import { useState } from 'react';

const UNITS = ['unit','pcs','kg','g','l','ml','box','pack','roll','set'];
const EMPTY = { name:'', sku:'', description:'', quantity:'', unit:'pcs', price:'', cost_price:'', low_stock_threshold:'5', category_id:'' };

export default function ItemForm({ initialData = {}, categories = [], onSubmit, loading }) {
  const [form,   setForm]   = useState({ ...EMPTY, ...initialData });
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
    if (Number(form.quantity) < 0) errs.quantity = 'Cannot be negative.';
    if (form.price === '')          errs.price    = 'Price is required.';
    if (Number(form.price) < 0)    errs.price    = 'Cannot be negative.';
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
      cost_price:          Number(form.cost_price) || 0,
      low_stock_threshold: Number(form.low_stock_threshold) || 5,
      category_id:         form.category_id || null,
      sku:                 form.sku || null,
    });
  };

  const inputStyle = { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' };
  const Field = ({ label, name, type = 'text', placeholder, required, min, step, children }) => (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      {children || (
        <input name={name} type={type} placeholder={placeholder}
          min={min} step={step} required={required}
          className="input" value={form[name]} onChange={set} />
      )}
      {errors[name] && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Item Name" name="name" placeholder="Wireless Mouse" required />
        <Field label="SKU" name="sku" placeholder="MSE-001" />
      </div>

      <Field label="Description" name="description">
        <textarea name="description" rows={2} className="input resize-none"
          placeholder="Optional description…" value={form.description} onChange={set} />
      </Field>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Quantity" name="quantity" type="number" min="0" placeholder="0" required />
        <Field label="Unit" name="unit">
          <select name="unit" className="input" value={form.unit} onChange={set}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Sell Price (RM)" name="price" type="number" min="0" step="0.01" placeholder="0.00" required />
        <Field label="Cost Price (RM)" name="cost_price" type="number" min="0" step="0.01" placeholder="0.00" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Low Stock Alert" name="low_stock_threshold" type="number" min="0" placeholder="5" />
        <Field label="Category" name="category_id">
          <select name="category_id" className="input" value={form.category_id} onChange={set}>
            <option value="">— None —</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="flex justify-end pt-1">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save Item'}
        </button>
      </div>
    </form>
  );
}
