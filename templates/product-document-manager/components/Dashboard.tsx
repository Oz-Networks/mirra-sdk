'use client';

import { useState, useEffect } from 'react';
import { MirraSDK } from '@mirra-messenger/sdk';
import { ThemeToggle } from '../providers/ThemeProvider';
import ProductDropdown from './ProductDropdown';
import DocumentUploader from './DocumentUploader';

// Initialize SDK with template API key
const sdk = new MirraSDK({
  apiKey: process.env.NEXT_PUBLIC_TEMPLATE_API_KEY!,
});

interface Product {
  id: string;
  name: string;
  createdAt: Date;
  memoryId?: string;
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  productId: string;
  documentId?: string;
}

interface DocumentProductLink {
  documentId: string;
  productId: string;
  memoryId?: string;
}

interface DashboardProps {
  userId: string;
  onSignOut: () => void;
  maxFileSize: number;
  allowedTypes: string;
  welcomeMessage: string;
}

export default function Dashboard({
  userId,
  onSignOut,
  maxFileSize,
  allowedTypes,
  welcomeMessage,
}: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    setSyncError(null);

    try {
      const productsResult: any = await sdk.memory.query({
        type: 'product',
        limit: 100,
      });

      // Handle normalized response: { data: { entities: [...] } } or legacy array format
      const productItems = Array.isArray(productsResult)
        ? productsResult
        : productsResult?.data?.entities || productsResult?.entities || [];
      if (productItems.length > 0) {
        const loadedProducts = productItems.map((p: any) => ({
          id: p.metadata?.productId || p.id,
          memoryId: p.id,
          name: p.metadata?.name || p.name || p.description || 'Untitled',
          createdAt: new Date(p.metadata?.createdAt || p.createdAt || Date.now()),
        }));
        setProducts(loadedProducts);
      }

      const linksResult: any = await sdk.memory.query({
        type: 'document-product-link',
        limit: 500,
      });

      const linkItems = Array.isArray(linksResult)
        ? linksResult
        : linksResult?.data?.entities || linksResult?.entities || [];
      const docProductMap: Record<string, string> = {};
      if (linkItems.length > 0) {
        for (const link of linkItems) {
          const docId = link.metadata?.documentId;
          const prodId = link.metadata?.productId;
          if (docId && prodId) {
            docProductMap[docId] = prodId;
          }
        }
      }

      const docsResult = await sdk.documents.list();

      if (docsResult && docsResult.documents) {
        const loadedDocs = docsResult.documents.map((d: any) => ({
          id: d.documentId,
          documentId: d.documentId,
          name: d.filename || d.title || 'Untitled',
          size: d.fileSize || 0,
          type: d.mimeType || 'application/octet-stream',
          uploadedAt: new Date(d.createdAt),
          productId: docProductMap[d.documentId] || '',
        }));
        setDocuments(loadedDocs);
      }
    } catch (err) {
      console.error('Error loading from cloud:', err);
      setSyncError('Unable to connect to cloud storage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      for (const product of updatedProducts) {
        const existing = products.find(p => p.id === product.id);
        if (!existing) {
          const result = await sdk.memory.create({
            type: 'product',
            content: product.name,
            metadata: {
              name: product.name,
              createdAt: product.createdAt.toISOString(),
              productId: product.id,
            },
          });
          product.memoryId = result.id;
        }
      }
    } catch (err) {
      console.error('Error syncing products to cloud:', err);
      setSyncError('Changes saved locally. Cloud sync pending.');
    }
  };

  const handleAddProduct = async (name: string) => {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      name,
      createdAt: new Date(),
    };

    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    setSelectedProduct(newProduct);
    await saveProducts(updatedProducts);
  };

  const handleUpload = async (files: File[]): Promise<Document[]> => {
    if (!selectedProduct) return [];

    const uploadedDocs: Document[] = [];

    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);

        const result = await sdk.documents.upload({
          file: base64,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          title: file.name,
        });

        await sdk.memory.create({
          type: 'document-product-link',
          content: `Document ${file.name} linked to ${selectedProduct.name}`,
          metadata: {
            documentId: result.documentId,
            productId: selectedProduct.id,
            filename: file.name,
            createdAt: new Date().toISOString(),
          },
        });

        const newDoc: Document = {
          id: result.documentId,
          documentId: result.documentId,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
          productId: selectedProduct.id,
        };

        uploadedDocs.push(newDoc);
      } catch (err) {
        console.error('Error uploading file:', file.name, err);
        throw err;
      }
    }

    const updatedDocs = [...documents, ...uploadedDocs];
    setDocuments(updatedDocs);

    return uploadedDocs;
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await sdk.documents.delete(documentId);

      const linksResult: any = await sdk.memory.query({
        type: 'document-product-link',
        limit: 500,
      });

      const deleteLinks = Array.isArray(linksResult)
        ? linksResult
        : linksResult?.data?.entities || linksResult?.entities || [];
      if (deleteLinks.length > 0) {
        const linkToDelete = deleteLinks.find(
          (link: any) => link.metadata?.documentId === documentId
        );
        if (linkToDelete) {
          await sdk.memory.delete(linkToDelete.id);
        }
      }
    } catch (err) {
      console.error('Error deleting document from cloud:', err);
    }

    const updatedDocs = documents.filter(d => d.id !== documentId);
    setDocuments(updatedDocs);
  };

  const handleViewDocument = async (documentId: string) => {
    try {
      const result = await sdk.documents.get(documentId);
      if (result && result.document) {
        return {
          title: result.document.title,
          filename: result.document.filename,
          extractedText: result.document.extractedText,
          processingStatus: result.document.processingStatus,
        };
      }
      return null;
    } catch (err) {
      console.error('Error fetching document:', err);
      return null;
    }
  };

  const totalDocuments = documents.length;
  const totalProducts = products.length;

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center animate-fade-in">
          <div
            className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse-subtle"
            style={{ background: 'var(--accent-primary)' }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 glass"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1
                  className="text-base font-display font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Document Manager
                </h1>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Sync status */}
              {syncError ? (
                <div className="badge badge-warning">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                  </svg>
                  Offline
                </div>
              ) : (
                <div className="badge badge-success">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Synced
                </div>
              )}

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Sign out */}
              <button
                onClick={onSignOut}
                className="btn btn-ghost text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome section */}
        <div className="mb-10 animate-fade-in">
          <h2
            className="text-2xl lg:text-3xl font-display font-semibold mb-2 text-balance"
            style={{ color: 'var(--text-primary)' }}
          >
            {welcomeMessage}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Select a product or create a new one to manage documents.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: 'Products',
              value: totalProducts,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              )
            },
            {
              label: 'Documents',
              value: totalDocuments,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              )
            },
            {
              label: 'Max Size',
              value: `${maxFileSize}MB`,
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              )
            },
            {
              label: 'Storage',
              value: 'Cloud',
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              )
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className={`card p-5 animate-slide-up stagger-${idx + 1}`}
              style={{ opacity: 0 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--accent-subtle)' }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {stat.icon}
                  </svg>
                </div>
                <div>
                  <p
                    className="text-xl font-display font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="text-xs font-medium uppercase tracking-wider"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Product selector */}
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Select Product
                </label>
                <ProductDropdown
                  products={products}
                  selectedProduct={selectedProduct}
                  onSelect={setSelectedProduct}
                  onAddNew={handleAddProduct}
                />
              </div>

              {/* Quick tips card */}
              <div
                className="p-5 rounded-2xl"
                style={{
                  background: 'var(--accent-subtle)',
                  border: '1px solid var(--accent-tertiary)'
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h4
                    className="font-semibold text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Quick Tips
                  </h4>
                </div>
                <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--accent-primary)' }}>1.</span>
                    Create products to organize documents
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--accent-primary)' }}>2.</span>
                    Drag & drop files for quick uploads
                  </li>
                  <li className="flex items-start gap-2">
                    <span style={{ color: 'var(--accent-primary)' }}>3.</span>
                    All files are stored securely in cloud
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="card-elevated p-6 lg:p-8">
              {selectedProduct ? (
                <>
                  <div className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <div className="flex items-center gap-3 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--accent-primary)' }}
                      />
                      <h3
                        className="text-xl font-display font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {selectedProduct.name}
                      </h3>
                    </div>
                    <p
                      className="text-sm ml-5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Upload and manage documents for this product
                    </p>
                  </div>
                  <DocumentUploader
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    documents={documents}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDocument}
                    onView={handleViewDocument}
                    maxFileSize={maxFileSize}
                    allowedTypes={allowedTypes}
                  />
                </>
              ) : (
                <div className="text-center py-16 lg:py-24">
                  <div
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--bg-tertiary)' }}
                  >
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3
                    className="text-xl font-display font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    No Product Selected
                  </h3>
                  <p
                    className="text-sm max-w-sm mx-auto"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Select a product from the dropdown or create a new one to start uploading documents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
