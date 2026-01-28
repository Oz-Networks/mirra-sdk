'use client';

import { useState, useRef, useCallback } from 'react';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  productId: string;
  documentId?: string;
}

interface DocumentContent {
  title?: string;
  filename: string;
  extractedText?: string;
  processingStatus: string;
}

interface DocumentUploaderProps {
  productId: string;
  productName: string;
  documents: Document[];
  onUpload: (files: File[]) => Promise<Document[]>;
  onDelete: (documentId: string) => Promise<void> | void;
  onView: (documentId: string) => Promise<DocumentContent | null>;
  maxFileSize: number;
  allowedTypes: string;
}

export default function DocumentUploader({
  productId,
  productName,
  documents,
  onUpload,
  onDelete,
  onView,
  maxFileSize,
  allowedTypes,
}: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [viewContent, setViewContent] = useState<DocumentContent | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAcceptedTypes = () => {
    switch (allowedTypes) {
      case 'pdf':
        return '.pdf';
      case 'office':
        return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
      case 'images':
        return '.jpg,.jpeg,.png,.gif,.webp,.svg';
      default:
        return '*';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    const iconStyle = { width: 20, height: 20 };

    if (type.includes('pdf')) {
      return (
        <svg style={{ ...iconStyle, color: '#dc2626' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zm-3 0a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5zm6 0a.5.5 0 01.5.5v3a.5.5 0 01-1 0v-3a.5.5 0 01.5-.5z"/>
        </svg>
      );
    }
    if (type.includes('image')) {
      return (
        <svg style={{ ...iconStyle, color: '#16a34a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (type.includes('word') || type.includes('document')) {
      return (
        <svg style={{ ...iconStyle, color: '#2563eb' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h8v1H8v-1zm0 2h8v1H8v-1zm0 2h5v1H8v-1z"/>
        </svg>
      );
    }
    if (type.includes('sheet') || type.includes('excel')) {
      return (
        <svg style={{ ...iconStyle, color: '#059669' }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM8 13h2v2H8v-2zm4 0h2v2h-2v-2zm-4 4h2v2H8v-2zm4 0h2v2h-2v-2z"/>
        </svg>
      );
    }
    return (
      <svg style={{ ...iconStyle, color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxBytes = maxFileSize * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxBytes) {
        setError(`"${file.name}" exceeds ${maxFileSize}MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);

    if (validFiles.length > 0) {
      await handleUpload(validFiles);
    }
  }, [maxFileSize]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = validateFiles(files);

    if (validFiles.length > 0) {
      await handleUpload(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const totalFiles = files.length;
    let completedFiles = 0;

    try {
      for (const file of files) {
        setCurrentFile(file.name);
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));

        await onUpload([file]);

        completedFiles++;
        setUploadProgress(Math.round((completedFiles / totalFiles) * 100));
      }

      setUploadProgress(100);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setCurrentFile(null);
      }, 500);
    }
  };

  const handleDelete = async (documentId: string) => {
    setDeleting(documentId);
    try {
      await onDelete(documentId);
    } catch (err) {
      setError('Failed to delete. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleView = async (documentId: string) => {
    setViewing(documentId);
    setViewError(null);
    setViewContent(null);
    try {
      const content = await onView(documentId);
      if (content) {
        setViewContent(content);
      } else {
        setViewError('Content not available.');
      }
    } catch (err) {
      setViewError('Failed to load content.');
    }
  };

  const closeViewer = () => {
    setViewing(null);
    setViewContent(null);
    setViewError(null);
  };

  const productDocuments = documents.filter(d => d.productId === productId);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`drop-zone relative p-8 lg:p-12 cursor-pointer transition-all duration-200 ${
          isDragging ? 'drop-zone-active' : ''
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={getAcceptedTypes()}
          multiple
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <div className="space-y-4">
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center animate-pulse-subtle"
                style={{ background: 'var(--accent-subtle)' }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Uploading...
                </p>
                {currentFile && (
                  <p
                    className="text-xs mt-1 truncate max-w-[200px] mx-auto"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {currentFile}
                  </p>
                )}
                <div
                  className="mt-4 w-48 mx-auto h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: 'var(--accent-primary)',
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--bg-tertiary)' }}
              >
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                Drop files here or{' '}
                <span style={{ color: 'var(--accent-primary)' }}>browse</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Max {maxFileSize}MB per file
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="p-4 rounded-xl flex items-center gap-3 animate-slide-up"
          style={{
            background: 'var(--error-subtle)',
            border: '1px solid var(--error)',
          }}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--error)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm flex-1" style={{ color: 'var(--error)' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            className="p-1 rounded-md transition-colors"
            style={{ color: 'var(--error)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Document list */}
      {productDocuments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--success)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Documents
            </h3>
            <span
              className="text-xs font-medium px-2 py-1 rounded-md"
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
            >
              {productDocuments.length}
            </span>
          </div>

          <div className="space-y-2">
            {productDocuments.map((doc, idx) => (
              <div
                key={doc.id}
                className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-150 animate-slide-up stagger-${Math.min(idx + 1, 4)}`}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-primary)',
                  opacity: deleting === doc.id ? 0.5 : 0,
                }}
              >
                <div className="flex-shrink-0">
                  {getFileIcon(doc.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {doc.name}
                  </p>
                  <div
                    className="flex items-center gap-2 text-xs mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    <span>{formatFileSize(doc.size)}</span>
                    <span>·</span>
                    <span>{doc.uploadedAt.toLocaleDateString()}</span>
                    {doc.documentId && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1" style={{ color: 'var(--success)' }}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Synced
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleView(doc.id)}
                    disabled={viewing === doc.id}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--accent-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                    title="View"
                  >
                    {viewing === doc.id ? (
                      <div
                        className="w-5 h-5 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: 'var(--border-secondary)',
                          borderTopColor: 'var(--accent-primary)',
                        }}
                      />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: 'var(--text-tertiary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--error-subtle)';
                      e.currentTarget.style.color = 'var(--error)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }}
                    title="Delete"
                  >
                    {deleting === doc.id ? (
                      <div
                        className="w-5 h-5 border-2 rounded-full animate-spin"
                        style={{
                          borderColor: 'var(--border-secondary)',
                          borderTopColor: 'var(--error)',
                        }}
                      />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {productDocuments.length === 0 && !uploading && (
        <div className="text-center py-8">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--text-tertiary)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            No documents yet
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
            Drop files above to get started
          </p>
        </div>
      )}

      {/* Document viewer modal */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
          onClick={closeViewer}
        >
          <div
            className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden animate-scale-in"
            style={{
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: '1px solid var(--border-primary)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-subtle)' }}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3
                    className="text-sm font-semibold truncate max-w-[300px]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {viewContent?.title || viewContent?.filename || 'Document'}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {viewContent?.processingStatus === 'completed' ? 'Ready' : viewContent?.processingStatus || 'Loading...'}
                  </p>
                </div>
              </div>
              <button
                onClick={closeViewer}
                className="p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {viewError ? (
                <div className="text-center py-12">
                  <div
                    className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--error-subtle)' }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--error)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--error)' }}>{viewError}</p>
                </div>
              ) : !viewContent ? (
                <div className="text-center py-12">
                  <div
                    className="w-8 h-8 mx-auto border-2 rounded-full animate-spin"
                    style={{
                      borderColor: 'var(--border-secondary)',
                      borderTopColor: 'var(--accent-primary)',
                    }}
                  />
                  <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Loading content...
                  </p>
                </div>
              ) : viewContent.processingStatus !== 'completed' ? (
                <div className="text-center py-12">
                  <div
                    className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--warning-subtle)' }}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: 'var(--warning)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Processing document...
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Check back in a moment
                  </p>
                </div>
              ) : viewContent.extractedText ? (
                <div
                  className="p-5 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {viewContent.extractedText}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    No text content available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
