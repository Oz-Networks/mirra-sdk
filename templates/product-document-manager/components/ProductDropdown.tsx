'use client';

import { useState, useRef, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  createdAt: Date;
}

interface ProductDropdownProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
  onAddNew: (name: string) => void;
}

export default function ProductDropdown({
  products,
  selectedProduct,
  onSelect,
  onAddNew,
}: ProductDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewProductName('');
        setError(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddProduct = () => {
    const trimmedName = newProductName.trim();

    if (!trimmedName) {
      setError('Product name is required');
      return;
    }

    if (products.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      setError('A product with this name already exists');
      return;
    }

    onAddNew(trimmedName);
    setNewProductName('');
    setIsAdding(false);
    setError(null);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddProduct();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewProductName('');
      setError(null);
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between gap-3 rounded-xl transition-all duration-150"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-subtle)' }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--accent-primary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="text-left">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Product
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: selectedProduct ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
            >
              {selectedProduct ? selectedProduct.name : 'Select a product...'}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden animate-slide-down"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {/* Product list */}
          <div className="max-h-64 overflow-y-auto">
            {products.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div
                  className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No products yet
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Add your first one below
                </p>
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
                  style={{
                    background: selectedProduct?.id === product.id ? 'var(--accent-subtle)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedProduct?.id !== product.id) {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selectedProduct?.id === product.id ? 'var(--accent-subtle)' : 'transparent';
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: selectedProduct?.id === product.id ? 'var(--accent-tertiary)' : 'var(--bg-tertiary)',
                    }}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{
                        color: selectedProduct?.id === product.id ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span
                    className="flex-1 text-left text-sm font-medium"
                    style={{
                      color: selectedProduct?.id === product.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {product.name}
                  </span>
                  {selectedProduct?.id === product.id && (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--accent-primary)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border-primary)' }} />

          {/* Add new product */}
          {isAdding ? (
            <div className="p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newProductName}
                  onChange={(e) => {
                    setNewProductName(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter product name..."
                  className="input flex-1 text-sm"
                  style={{ padding: '10px 14px' }}
                />
                <button
                  onClick={handleAddProduct}
                  className="btn btn-primary"
                  style={{ padding: '10px 14px' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewProductName('');
                    setError(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '10px 14px' }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {error && (
                <p className="mt-2 text-xs" style={{ color: 'var(--error)' }}>{error}</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-subtle)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-subtle)' }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                Add New Product
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
