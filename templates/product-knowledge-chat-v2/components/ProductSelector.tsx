'use client';

import { useState, useRef, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
  loading?: boolean;
}

export default function ProductSelector({
  products,
  selectedProduct,
  onSelect,
  loading = false,
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div
        className="h-11 rounded-xl flex items-center px-4 gap-3"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
      >
        <div
          className="w-4 h-4 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'var(--accent-primary)' }}
        />
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Loading products...
        </span>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className="h-11 rounded-xl flex items-center px-4"
        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No products available
        </span>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-11 w-full md:w-auto md:min-w-[200px] px-4 flex items-center justify-between gap-3 rounded-xl transition-all duration-150"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--accent-primary)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span
            className="text-sm font-medium truncate"
            style={{ color: selectedProduct ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
          >
            {selectedProduct ? selectedProduct.name : 'Select product'}
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden animate-slide-down"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onSelect(product);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left"
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
                <svg
                  className="w-4 h-4 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{
                    color: selectedProduct?.id === product.id ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span
                  className="text-sm font-medium truncate"
                  style={{
                    color: selectedProduct?.id === product.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {product.name}
                </span>
                {selectedProduct?.id === product.id && (
                  <svg
                    className="w-4 h-4 ml-auto flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
