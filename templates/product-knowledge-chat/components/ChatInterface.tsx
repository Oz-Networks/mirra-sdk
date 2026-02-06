'use client';

import { useState, useEffect, useRef } from 'react';
import { MirraSDK } from '@mirra-messenger/sdk';
import { ThemeToggle } from '../providers/ThemeProvider';
import ProductSelector from './ProductSelector';
import MarkdownRenderer from './MarkdownRenderer';

const sdk = new MirraSDK({
  apiKey: process.env.NEXT_PUBLIC_TEMPLATE_API_KEY!,
});

interface Product {
  id: string;
  name: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: DocumentSource[];
  timestamp: Date;
}

interface DocumentSource {
  documentId: string;
  content: string;
  score: number;
}

interface ChatInterfaceProps {
  companyName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  aiModel: string;
  systemPrompt: string;
  showSources: boolean;
  suggestedQuestions: string[];
}

export default function ChatInterface({
  companyName,
  welcomeTitle,
  welcomeSubtitle,
  aiModel,
  systemPrompt,
  showSources,
  suggestedQuestions,
}: ChatInterfaceProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [inputValue]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const result: any = await sdk.memory.query({
        type: 'product',
        limit: 100,
      });

      const items = Array.isArray(result)
        ? result
        : result?.data?.entities || result?.entities || [];
      if (items.length > 0) {
        const loadedProducts = items.map((p: any) => ({
          id: p.metadata?.productId || p.id,
          name: p.metadata?.name || p.name || p.description || 'Untitled',
        }));
        setProducts(loadedProducts);

        // Auto-select first product if only one
        if (loadedProducts.length === 1) {
          setSelectedProduct(loadedProducts[0]);
        }
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Unable to load products. Please try again.');
    } finally {
      setProductsLoading(false);
    }
  };

  const searchDocuments = async (query: string, productId: string): Promise<DocumentSource[]> => {
    try {
      // First, get document IDs linked to this product
      const linksResult: any = await sdk.memory.query({
        type: 'document_product_link',
        limit: 100,
      });

      const linkItems = Array.isArray(linksResult)
        ? linksResult
        : linksResult?.data?.entities || linksResult?.entities || [];
      const productDocIds = linkItems
        .filter((link: any) => link.metadata?.productId === productId)
        .map((link: any) => link.metadata?.documentId)
        .filter(Boolean);

      if (productDocIds.length === 0) {
        return [];
      }

      // Search all documents
      const searchResult = await sdk.documents.search({
        query,
        limit: 10,
        threshold: 0.5,
      });

      // Filter to only include results from product's documents
      const relevantResults = searchResult.results
        ?.filter((r: any) => productDocIds.includes(r.documentId))
        .slice(0, 5) || [];

      return relevantResults.map((r: any) => ({
        documentId: r.documentId,
        content: r.content,
        score: r.score,
      }));
    } catch (err) {
      console.error('Error searching documents:', err);
      return [];
    }
  };

  const handleSubmit = async (question?: string) => {
    const query = question || inputValue.trim();
    if (!query || !selectedProduct || isLoading) return;

    setInputValue('');
    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Search for relevant documents
      const sources = await searchDocuments(query, selectedProduct.id);

      // Build context from sources
      let context = '';
      if (sources.length > 0) {
        context = sources.map((s, i) => `[Source ${i + 1}]\n${s.content}`).join('\n\n---\n\n');
      }

      // Build messages for chat
      const chatMessages: any[] = [
        {
          role: 'system',
          content: sources.length > 0
            ? `${systemPrompt}\n\nProduct: ${selectedProduct.name}\n\nRelevant documentation:\n${context}`
            : `${systemPrompt}\n\nProduct: ${selectedProduct.name}\n\nNote: No specific documentation was found for this question. Provide a helpful general response and suggest the customer contact support if needed.`,
        },
      ];

      // Add conversation history (last 6 messages for context)
      const recentMessages = messages.slice(-6);
      for (const msg of recentMessages) {
        chatMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }

      // Add current question
      chatMessages.push({
        role: 'user',
        content: query,
      });

      // Create placeholder for assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        sources: showSources ? sources : undefined,
        timestamp: new Date(),
      }]);

      // Get AI response
      const response: any = await sdk.ai.chat({
        messages: chatMessages,
        model: aiModel,
        temperature: 0.3,
        maxTokens: 1500,
      });

      const content = response?.content || response?.data?.content || response?.message || '';
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, content }
          : msg
      ));
    } catch (err: any) {
      console.error('Error getting response:', err);
      setError('Failed to get a response. Please try again.');
      // Remove the empty assistant message
      setMessages(prev => prev.filter(m => m.content || m.role === 'user'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 glass"
        style={{ borderBottom: '1px solid var(--border-primary)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--accent-primary)' }}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {companyName}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasMessages && (
                <button
                  onClick={clearChat}
                  className="btn btn-ghost text-xs px-3 py-1.5"
                >
                  Clear chat
                </button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6">
        {!hasMessages ? (
          // Welcome state
          <div className="flex-1 flex flex-col items-center justify-center py-12 animate-fade-in">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: 'var(--accent-subtle)' }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--accent-primary)' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            <h1
              className="text-2xl sm:text-3xl font-display font-semibold text-center mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {welcomeTitle}
            </h1>
            <p
              className="text-sm text-center max-w-md mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {welcomeSubtitle}
            </p>

            {/* Product selector */}
            <div className="w-full max-w-xs mb-8">
              <ProductSelector
                products={products}
                selectedProduct={selectedProduct}
                onSelect={setSelectedProduct}
                loading={productsLoading}
              />
            </div>

            {/* Suggested questions */}
            {selectedProduct && suggestedQuestions.length > 0 && (
              <div className="w-full max-w-md space-y-2">
                <p
                  className="text-xs font-medium text-center mb-3"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  Try asking
                </p>
                {suggestedQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(question)}
                    disabled={isLoading}
                    className="w-full p-3 text-left text-sm rounded-xl transition-all duration-150"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.background = 'var(--accent-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Chat messages
          <div className="flex-1 py-6 overflow-y-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] ${
                      message.role === 'user' ? 'message-user' : 'message-assistant'
                    } px-4 py-3`}
                  >
                    <div className="text-sm">
                      {message.content ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                          <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                          <span className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {message.role === 'assistant' && message.sources && message.sources.length > 0 && message.content && (
                      <div
                        className="mt-3 pt-3"
                        style={{ borderTop: '1px solid var(--border-primary)' }}
                      >
                        <p
                          className="text-xs font-medium mb-2"
                          style={{ color: 'var(--text-tertiary)' }}
                        >
                          Sources ({message.sources.length})
                        </p>
                        <div className="space-y-1">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-2 rounded-lg"
                              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                            >
                              <span className="line-clamp-2">{source.content.substring(0, 150)}...</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            className="mx-4 mb-4 p-3 rounded-xl flex items-center gap-2 animate-slide-up"
            style={{ background: 'var(--error-subtle)', border: '1px solid var(--error)' }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--error)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm" style={{ color: 'var(--error)' }}>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto" style={{ color: 'var(--error)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="sticky bottom-0 py-4" style={{ background: 'var(--bg-primary)' }}>
          {/* Product selector when in chat mode */}
          {hasMessages && (
            <div className="mb-3">
              <ProductSelector
                products={products}
                selectedProduct={selectedProduct}
                onSelect={setSelectedProduct}
                loading={productsLoading}
              />
            </div>
          )}

          <div
            className="flex items-end gap-2 p-2 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedProduct ? `Ask about ${selectedProduct.name}...` : 'Select a product to start'}
              disabled={!selectedProduct || isLoading}
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 px-2"
              style={{
                color: 'var(--text-primary)',
                minHeight: '40px',
                maxHeight: '150px',
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim() || !selectedProduct || isLoading}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              style={{
                background: inputValue.trim() && selectedProduct && !isLoading ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: inputValue.trim() && selectedProduct && !isLoading ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {isLoading ? (
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'currentColor' }}
                />
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          <p
            className="text-xs text-center mt-3"
            style={{ color: 'var(--text-tertiary)' }}
          >
            AI responses are based on product documentation and may not always be accurate.
          </p>
        </div>
      </main>
    </div>
  );
}
