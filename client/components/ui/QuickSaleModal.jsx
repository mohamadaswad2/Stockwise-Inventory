/**
 * QuickSaleModal — Fixed version:
 * 1. Uses useCurrency for proper currency display (not hardcoded RM)
 * 2. Passes costPrice for profit tracking
 * 3. e.currentTarget for hover events (not e.target)
 * 4. Shows out-of-stock items as disabled, not hidden
 */
import { useState, useEffect, useRef } from 'react';
import { Search, Package, X, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordTransaction } from '../../services/transaction.service';
import { getInventory } from '../../services/inventory.service';
import { useCurrency } from '../../contexts/CurrencyContext';

export default function QuickSaleModal({ isOpen, onClose, onSuccess }) {
  const { format } = useCurrency();
  const [search,        setSearch]        = useState('');
  const [items,         setItems]         = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem,  setSelectedItem]  = useState(null);
  const [quantity,      setQuantity]      = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [loadingItems,  setLoadingItems]  = useState(false);
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(false);
  const [totalCount,     setTotalCount]    = useState(0);
  const searchRef = useRef(null);

  // Load items when modal opens
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      loadInventory();
      setSearch('');
      setSelectedItem(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // Auto-focus search
  useEffect(() => {
    if (isOpen) setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  // Filter items - client side search untuk better UX
  useEffect(() => {
    const q = search.trim().toLowerCase();
    let filtered = items;
    
    // Client-side search untuk semua items
    if (q) {
      filtered = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.sku?.toLowerCase().includes(q)
      );
    }
    
    // Show 10 items untuk performance, tapi ada "Load More" jika ada lebih
    setFilteredItems(filtered.slice(0, 10));
    setHasMore(filtered.length > 10);
  }, [search, items]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const loadInventory = async (resetPage = false) => {
    setLoadingItems(true);
    try {
      // Load semua items dalam batches untuk performance
      const res = await getInventory({ 
        page: resetPage ? 1 : page, 
        limit: 100 
      });
      
      if (resetPage) {
        setItems(res.data.data.items || []);
        setPage(1);
      } else {
        setItems(prev => [...prev, ...(res.data.data.items || [])]);
      }
      
      setTotalCount(res.data.data.total || 0);
      setHasMore((res.data.data.items || []).length === 100);
    } catch {
      toast.error('Failed to load inventory.');
    } finally {
      setLoadingItems(false);
    }
  };

  // Load more items
  const loadMore = () => {
    if (!loadingItems && hasMore) {
      setPage(prev => prev + 1);
      loadInventory(false);
    }
  };

  const handleItemSelect = (item) => {
    if (item.quantity === 0) return; // Can't sell out of stock
    setSelectedItem(item);
    setQuantity(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) { toast.error('Please select an item.'); return; }
    if (quantity < 1)   { toast.error('Quantity must be at least 1.'); return; }
    if (quantity > selectedItem.quantity) {
      toast.error(`Only ${selectedItem.quantity} ${selectedItem.unit} available.`);
      return;
    }

    setLoading(true);
    try {
      await recordTransaction({
        itemId:    selectedItem.id,
        type:      'sale',
        quantity:  quantity,
        unitPrice: selectedItem.price,
        costPrice: selectedItem.cost_price || 0, // FIX: include for profit tracking
        note:      'Quick sale (FAB)',
      });

      toast.success(`✅ Sold ${quantity} × ${selectedItem.name}!`);
      setSearch('');
      setSelectedItem(null);
      setQuantity(1);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalAmt = (Number(selectedItem?.price || 0) * quantity);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center', zIndex: 2000,
        padding: '0',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Bottom sheet on mobile, centered on desktop */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '88vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
      }}
      className="sm:mb-8 sm:rounded-2xl">

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: 'var(--surface3)' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '12px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>Quick Sale</h2>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text2)' }}>Search and sell instantly</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: 'var(--text3)', display: 'flex' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <form onSubmit={handleSubmit}>
            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input ref={searchRef} type="text" value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Type item name or SKU…"
                className="input" style={{ paddingLeft: '36px' }} />
            </div>

            {/* Item list */}
            {loadingItems ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: '14px' }}>
                Loading items…
                {totalCount > 0 && (
                  <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                    {totalCount} total items
                  </p>
                )}
              </div>
            ) : filteredItems.length > 0 ? (
              <>
                <div style={{ marginBottom: '16px', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden' }}>
                  {filteredItems.map((item, idx) => {
                    const isSelected  = selectedItem?.id === item.id;
                    const isOutOfStock = item.quantity === 0;
                    return (
                      <div key={item.id}
                        onClick={() => handleItemSelect(item)}
                        style={{
                          padding: '11px 14px',
                          borderBottom: idx < filteredItems.length - 1 ? '1px solid var(--border)' : 'none',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: isSelected ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))' : 'transparent',
                          opacity: isOutOfStock ? 0.5 : 1,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { if (!isSelected && !isOutOfStock) e.currentTarget.style.background = 'var(--surface2)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))' : 'transparent'; }}>
                        <div>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: isSelected ? 'var(--accent3)' : 'var(--text)' }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text3)' }}>
                            {item.sku ? `${item.sku} · ` : ''}
                            {isOutOfStock ? 'Out of stock' : `${item.quantity} ${item.unit} left`}
                          </p>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: isSelected ? 'var(--accent3)' : 'var(--green)', flexShrink: 0 }}>
                          {format(item.price)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                
                {/* Load More Button */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingItems}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      background: 'var(--surface2)',
                      color: 'var(--text)',
                      cursor: loadingItems ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!loadingItems) e.currentTarget.style.background = 'var(--surface3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface2)'; }}
                  >
                    {loadingItems ? (
                      <div style={{ width: '14px', height: '14px', border: '2px solid var(--text3)', borderTop: '2px solid var(--accent)', borderRadius: '50%', animation: 'fabSpin 1s linear infinite' }} />
                    ) : (
                      <>
                        <span>Load More</span>
                        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '400' }}>
                          ({items.length} of {totalCount})
                        </span>
                      </>
                    )}
                  </button>
                )}
              </>
            ) : search.trim() ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: '13px' }}>
                No items found for "{search}"
              </div>
            ) : null}

            {/* Quantity + summary */}
            {selectedItem && (
              <div style={{ marginBottom: '16px' }}>
                <label className="label">Quantity</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <button type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    −
                  </button>
                  <input type="number" min="1" max={selectedItem.quantity} value={quantity}
                    onChange={e => setQuantity(Math.max(1, Math.min(selectedItem.quantity, Number(e.target.value) || 1)))}
                    className="input" style={{ textAlign: 'center', fontWeight: '700', fontSize: '18px' }} />
                  <button type="button"
                    onClick={() => setQuantity(q => Math.min(selectedItem.quantity, q + 1))}
                    style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    +
                  </button>
                </div>

                {/* Summary */}
                <div style={{ padding: '14px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{selectedItem.name} × {quantity}</span>
                  <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--green)' }}>{format(totalAmt)}</span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '13px', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                Cancel
              </button>
              <button type="submit" disabled={!selectedItem || loading}
                style={{ flex: 2, padding: '13px', border: 'none', borderRadius: '12px', background: selectedItem && !loading ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'var(--surface3)', color: selectedItem && !loading ? 'white' : 'var(--text3)', cursor: selectedItem && !loading ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {loading && <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'fabSpin 1s linear infinite' }} />}
                {loading ? 'Recording…' : 'Record Sale'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
