'use client';

import { useState, useEffect } from 'react';
import { MirraSDK } from '@mirra-messenger/sdk';
import ProductDropdown from './ProductDropdown';
import DocumentUploader from './DocumentUploader';

// Initialize SDK with template API key
// Cast to any to access documents API (available in newer SDK versions)
const sdk = new MirraSDK({
  apiKey: process.env.NEXT_PUBLIC_TEMPLATE_API_KEY!,
}) as any;

interface Product {
  id: string;
  name: string;
  createdAt: Date;
}

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  productId: string;
  documentId?: string; // Mirra document ID for cloud storage
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

  // Load data on mount - try cloud first, fallback to localStorage
  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    setSyncError(null);

    try {
      // Try to load products from memory (cloud storage)
      const productsResult = await sdk.memory.query({
        filters: { type: 'product', userId },
        limit: 100,
      });

      if (productsResult && productsResult.length > 0) {
        const loadedProducts = productsResult.map((p: any) => ({
          id: p.id,
          name: p.metadata?.name || p.content,
          createdAt: new Date(p.metadata?.createdAt || Date.now()),
        }));
        setProducts(loadedProducts);
      }

      // Load documents from Mirra Documents API
      const docsResult = await sdk.documents.list({ limit: 100 });
      
      if (docsResult && docsResult.documents) {
        const loadedDocs = docsResult.documents.map((d: any) => ({
          id: d.documentId,
          documentId: d.documentId,
          name: d.filename || d.title || 'Untitled',
          size: d.fileSize || 0,
          type: d.mimeType || 'application/octet-stream',
          uploadedAt: new Date(d.createdAt),
          productId: d.productTags?.[0] || '', // Use productTag to link to product
        }));
        setDocuments(loadedDocs);
      }
    } catch (err) {
      console.error('Error loading from cloud, falling back to localStorage:', err);
      setSyncError('Unable to sync with cloud. Using local storage.');
      
      // Fallback to localStorage
      const storedProducts = localStorage.getItem(`products_${userId}`);
      const storedDocuments = localStorage.getItem(`documents_${userId}`);

      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        setProducts(parsed.map((p: any) => ({ ...p, createdAt: new Date(p.createdAt) })));
      }

      if (storedDocuments) {
        const parsed = JSON.parse(storedDocuments);
        setDocuments(parsed.map((d: any) => ({ ...d, uploadedAt: new Date(d.uploadedAt) })));
      }
    } finally {
      setLoading(false);
    }
  };

  // Save products to cloud and localStorage
  const saveProducts = async (updatedProducts: Product[]) => {
    // Always save to localStorage as backup
    localStorage.setItem(`products_${userId}`, JSON.stringify(updatedProducts));

    try {
      // Sync to cloud via memory API
      for (const product of updatedProducts) {
        const existing = products.find(p => p.id === product.id);
        if (!existing) {
          // New product - create in cloud
          await sdk.memory.create({
            type: 'product',
            content: product.name,
            metadata: {
              userId,
              name: product.name,
              createdAt: product.createdAt.toISOString(),
              productId: product.id,
            },
          });
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
        // Convert file to base64
        const base64 = await fileToBase64(file);
        
        // Upload to Mirra Documents API
        const result = await sdk.documents.upload({
          file: base64,
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          title: file.name,
          productTags: [selectedProduct.id], // Tag with product ID
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

    // Update local state
    const updatedDocs = [...documents, ...uploadedDocs];
    setDocuments(updatedDocs);
    
    // Backup to localStorage
    localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocs));

    return uploadedDocs;
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      // Delete from Mirra Documents API
      await sdk.documents.delete(documentId);
    } catch (err) {
      console.error('Error deleting document from cloud:', err);
      // Continue with local deletion even if cloud fails
    }

    // Update local state
    const updatedDocs = documents.filter(d => d.id !== documentId);
    setDocuments(updatedDocs);
    localStorage.setItem(`documents_${userId}`, JSON.stringify(updatedDocs));
  };

  const totalDocuments = documents.length;
  const totalProducts = products.length;

  // Helper function to convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-slate-900 dark:text-white">
                Product Documents
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage your documentation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Sync status indicator */}
            {syncError ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Offline mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Synced</span>
              </div>
            )}

            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome section */}
        <div className="mb-10 animate-fade-in">
          <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
            {welcomeMessage}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Select a product or create a new one to start uploading documents.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 animate-slide-up">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalProducts}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Products</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDocuments}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Documents</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{maxFileSize}MB</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Max Size</p>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">Cloud</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Storage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Product selection */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
                Select Product
              </h3>
              <ProductDropdown
                products={products}
                selectedProduct={selectedProduct}
                onSelect={setSelectedProduct}
                onAddNew={handleAddProduct}
              />

              {/* Quick tips */}
              <div className="mt-8 p-5 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quick Tips
                </h4>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    Create products to organize your documents
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    Drag & drop files to upload quickly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-500 mt-1">•</span>
                    Documents are stored securely in the cloud
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Document uploader */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
              {selectedProduct ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-1">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Upload and manage documents for this product
                    </p>
                  </div>
                  <DocumentUploader
                    productId={selectedProduct.id}
                    productName={selectedProduct.name}
                    documents={documents}
                    onUpload={handleUpload}
                    onDelete={handleDeleteDocument}
                    maxFileSize={maxFileSize}
                    allowedTypes={allowedTypes}
                  />
                </>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-display font-semibold text-slate-900 dark:text-white mb-2">
                    No Product Selected
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
