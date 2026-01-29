'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState } from 'react';

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="md-copy-btn"
      aria-label="Copy code"
    >
      {copied ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="md-prose"
      components={{
        h1: ({ children }) => <h1 className="md-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="md-h2">{children}</h2>,
        h3: ({ children }) => <h3 className="md-h3">{children}</h3>,
        h4: ({ children }) => <h4 className="md-h4">{children}</h4>,
        p: ({ children }) => <p className="md-p">{children}</p>,
        strong: ({ children }) => <strong className="md-strong">{children}</strong>,
        em: ({ children }) => <em className="md-em">{children}</em>,
        a: ({ href, children }) => (
          <a href={href} className="md-link" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="md-ul">{children}</ul>,
        ol: ({ children }) => <ol className="md-ol">{children}</ol>,
        li: ({ children }) => <li className="md-li">{children}</li>,
        blockquote: ({ children }) => <blockquote className="md-blockquote">{children}</blockquote>,
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const isBlock = match || (typeof children === 'string' && children.includes('\n'));

          if (isBlock) {
            const codeString = String(children).replace(/^\n+|\n+$/g, '');
            return (
              <div className="md-code-block">
                <div className="md-code-header">
                  {match && <span className="md-code-lang">{match[1]}</span>}
                  <CopyButton code={codeString} />
                </div>
                <pre className="md-pre">
                  <code className={className} {...props}>{codeString}</code>
                </pre>
              </div>
            );
          }

          return <code className="md-inline-code" {...props}>{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="md-hr" />,
        table: ({ children }) => (
          <div className="md-table-wrap">
            <table className="md-table">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="md-thead">{children}</thead>,
        th: ({ children }) => <th className="md-th">{children}</th>,
        td: ({ children }) => <td className="md-td">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
