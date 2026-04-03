/**
 * QuickSaleModal - Modal for recording quick sales
 * Search, select item, enter quantity, record sale
 */
import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { recordTransaction } from '../../services/transaction.service';
import { getInventory } from '../../services/inventory.service';

const QuickSaleModal = ({ isOpen, onClose, onSuccess }) => {
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const searchInputRef = useRef(null);

  // Load inventory items when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInventory();
      setSearch('');
      setSelectedItem(null);
      setQuantity(1);
    }
  }, [isOpen]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100);
    }
  }, [isOpen]);

  // Filter items based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredItems(items.slice(0, 10)); // Show first 10 items
    } else {
      const filtered = items.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.sku?.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredItems(filtered.slice(0, 10));
    }
  }, [search, items]);

  const loadInventory = async () => {
    setLoadingItems(true);
    try {
      const response = await getInventory({ page: 1, limit: 100 });
      setItems(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      toast.error('Failed to load inventory items');
    } finally {
      setLoadingItems(false);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setSearch(item.name);
    setQuantity(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast.error('Please select an item');
      return;
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      await recordTransaction({
        itemId: selectedItem.id,
        type: 'sale',
        quantity: quantity,
        unitPrice: selectedItem.price,
        note: 'Quick sale via FAB'
      });

      toast.success(`Sale recorded: ${selectedItem.name} (${quantity} units)`);
      
      // Reset form
      setSearch('');
      setSelectedItem(null);
      setQuantity(1);
      
      // Close modal and notify parent
      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1000);

    } catch (error) {
      console.error('Failed to record sale:', error);
      const message = error.response?.data?.message || 'Failed to record sale';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && selectedItem && quantity >= 1) {
      handleSubmit(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px',
      }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transform: 'translateY(0)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* Header */}
        <div 
          className="modal-header"
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg,var(--accent),var(--accent2))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={20} color="white" />
            </div>
            <div>
              <h2 style={{ 
                margin: 0, 
                fontSize: '18px', 
                fontWeight: '600', 
                color: 'var(--text)' 
              }}>
                Record Quick Sale
              </h2>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: 'var(--text2)',
                marginTop: '2px'
              }}>
                Search and record sale instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text3)',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--surface2)';
              e.target.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = 'var(--text3)';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
          {/* Search Input */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text)',
              marginBottom: '8px'
            }}>
              Search Item
            </label>
            <div style={{ position: 'relative' }}>
              <Search 
                size={18} 
                color="var(--text3)" 
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type item name or SKU..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.backgroundColor = 'var(--surface)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.backgroundColor = 'var(--surface2)';
                }}
              />
            </div>
          </div>

          {/* Item List */}
          {loadingItems ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: 'var(--text3)' 
            }}>
              Loading items...
            </div>
          ) : filteredItems.length > 0 ? (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text3)', 
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                {filteredItems.length} items found
              </div>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                backgroundColor: 'var(--surface2)',
              }}>
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: selectedItem?.id === item.id ? 'var(--accent)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedItem?.id !== item.id) {
                        e.currentTarget.style.backgroundColor = 'var(--surface3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedItem?.id !== item.id) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        color: selectedItem?.id === item.id ? 'white' : 'var(--text)',
                        marginBottom: '2px'
                      }}>
                        {item.name}
                      </div>
                      {item.sku && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: selectedItem?.id === item.id ? 'rgba(255,255,255,0.7)' : 'var(--text3)' 
                        }}>
                          SKU: {item.sku}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: selectedItem?.id === item.id ? 'white' : 'var(--green)',
                      }}>
                        RM{(Number(item.price) || 0).toFixed(2)}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: selectedItem?.id === item.id ? 'rgba(255,255,255,0.7)' : 'var(--text3)' 
                      }}>
                        Stock: {item.quantity} {item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : search.trim() ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 0', 
              color: 'var(--text3)' 
            }}>
              No items found for "{search}"
            </div>
          ) : null}

          {/* Quantity Input */}
          {selectedItem && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: 'var(--text)',
                marginBottom: '8px'
              }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max={selectedItem.quantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(selectedItem.quantity, parseInt(e.target.value) || 1)))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  backgroundColor: 'var(--surface2)',
                  color: 'var(--text)',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--accent)';
                  e.target.style.backgroundColor = 'var(--surface)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.backgroundColor = 'var(--surface2)';
                }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: 'var(--text3)', 
                marginTop: '4px' 
              }}>
                Available stock: {selectedItem.quantity} {selectedItem.unit}
              </div>
            </div>
          )}

          {/* Selected Item Summary */}
          {selectedItem && (
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--surface2)',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid var(--border)',
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>
                  Total Amount:
                </span>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: 'var(--green)' 
                }}>
                  RM{(Number(selectedItem.price) * Number(quantity)).toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                {selectedItem.name} × {quantity} {selectedItem.unit}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px 20px',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: 'var(--surface2)',
                color: 'var(--text)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--surface3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--surface2)';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedItem || loading}
              style={{
                flex: 2,
                padding: '14px 20px',
                border: 'none',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '500',
                background: selectedItem && !loading 
                  ? 'linear-gradient(135deg,var(--accent),var(--accent2))' 
                  : 'var(--surface3)',
                color: selectedItem && !loading ? 'white' : 'var(--text3)',
                cursor: selectedItem && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (selectedItem && !loading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedItem && !loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              {loading && (
                <div 
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'quickSaleSpin 1s linear infinite',
                  }}
                />
              )}
              {loading ? 'Recording...' : 'Record Sale'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickSaleModal;
