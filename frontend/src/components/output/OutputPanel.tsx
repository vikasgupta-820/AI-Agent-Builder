import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useExecutionStore } from '../../stores/useExecutionStore';

export function OutputPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const finalOutput = useExecutionStore((s) => s.finalOutput);
  const status = useExecutionStore((s) => s.status);

  const handleCopy = useCallback(() => {
    if (!finalOutput) return;
    navigator.clipboard.writeText(finalOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [finalOutput]);

  if (!finalOutput || status !== 'completed') return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
        style={{
          backgroundColor: '#10b981',
          color: 'white',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        View Output
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary, #1e1e2e)',
          border: '1px solid var(--color-border, #2e3040)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border, #2e3040)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: '#10b981' }}
            />
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-primary, #e2e8f0)' }}
            >
              Workflow Output
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: copied ? '#10b981' : 'var(--color-bg-tertiary, #2e3040)',
                color: copied ? 'white' : 'var(--color-text-secondary, #94a3b8)',
                border: '1px solid var(--color-border, #2e3040)',
              }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--color-text-muted, #64748b)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="markdown-output">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mb-3 mt-6" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mb-2 mt-5" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold mb-2 mt-4" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text-secondary, #94a3b8)' }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside space-y-1 mb-3 ml-2" style={{ color: 'var(--color-text-secondary, #94a3b8)' }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside space-y-1 mb-3 ml-2" style={{ color: 'var(--color-text-secondary, #94a3b8)' }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm leading-relaxed">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    className="border-l-4 pl-4 py-1 my-3 italic"
                    style={{
                      borderColor: 'var(--color-accent, #6366f1)',
                      backgroundColor: 'var(--color-bg-tertiary, #2e3040)',
                      color: 'var(--color-text-secondary, #94a3b8)',
                    }}
                  >
                    {children}
                  </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !String(children).includes('\n');

                  if (isInline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded text-xs font-mono"
                        style={{
                          backgroundColor: 'var(--color-bg-tertiary, #2e3040)',
                          color: '#f472b6',
                        }}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="relative my-4 rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border, #2e3040)' }}>
                      {match && (
                        <div
                          className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider"
                          style={{
                            backgroundColor: 'var(--color-bg-tertiary, #2e3040)',
                            color: 'var(--color-text-muted, #64748b)',
                            borderBottom: '1px solid var(--color-border, #2e3040)',
                          }}
                        >
                          {match[1]}
                        </div>
                      )}
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match ? match[1] : 'text'}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '16px',
                          background: '#1a1b26',
                          fontSize: '12px',
                          lineHeight: '1.6',
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
                pre: ({ children }) => <>{children}</>,
                hr: () => (
                  <hr className="my-6" style={{ borderColor: 'var(--color-border, #2e3040)' }} />
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline transition-colors"
                    style={{ color: 'var(--color-accent, #6366f1)' }}
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4 rounded-lg" style={{ border: '1px solid var(--color-border, #2e3040)' }}>
                    <table className="w-full text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead style={{ backgroundColor: 'var(--color-bg-tertiary, #2e3040)' }}>{children}</thead>
                ),
                th: ({ children }) => (
                  <th
                    className="px-4 py-2 text-left text-xs font-semibold"
                    style={{ color: 'var(--color-text-primary, #e2e8f0)', borderBottom: '1px solid var(--color-border, #2e3040)' }}
                  >
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td
                    className="px-4 py-2 text-xs"
                    style={{ color: 'var(--color-text-secondary, #94a3b8)', borderBottom: '1px solid var(--color-border, #2e3040)' }}
                  >
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold" style={{ color: 'var(--color-text-primary, #e2e8f0)' }}>
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em style={{ color: 'var(--color-text-secondary, #94a3b8)' }}>
                    {children}
                  </em>
                ),
              }}
            >
              {finalOutput}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--color-border, #2e3040)' }}
        >
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted, #64748b)' }}>
            {finalOutput.length.toLocaleString()} characters
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-bg-tertiary, #2e3040)',
              color: 'var(--color-text-secondary, #94a3b8)',
              border: '1px solid var(--color-border, #2e3040)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
