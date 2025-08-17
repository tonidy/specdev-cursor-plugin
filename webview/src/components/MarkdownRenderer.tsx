import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

interface MarkdownRendererProps {
  content: string;
  enableMermaid?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  enableMermaid = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (enableMermaid && containerRef.current) {
      // Initialize mermaid
      mermaid.initialize({ 
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#bb2528',
          primaryTextColor: '#fff',
          primaryBorderColor: '#7C0000',
          lineColor: '#F8B229',
          sectionBkgColor: '#1f1f1f',
          altSectionBkgColor: '#2a2a2a',
          gridColor: '#444',
          secondaryColor: '#006100',
          tertiaryColor: '#fff'
        }
      });

      // Find and render mermaid diagrams
      const mermaidElements = containerRef.current.querySelectorAll('.language-mermaid');
      mermaidElements.forEach((element, index) => {
        const graphDefinition = element.textContent || '';
        // Create a valid CSS selector ID (no dots, only alphanumeric and hyphens)
        const graphId = `mermaid-${Date.now()}-${index}`.replace(/\./g, '-');

        try {
          mermaid.render(graphId, graphDefinition).then(({ svg }) => {
            element.innerHTML = svg;
          }).catch((error) => {
            console.error('Mermaid rendering error:', error);
            element.innerHTML = `<div class="mermaid-error">Error rendering diagram: ${error.message}</div>`;
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          element.innerHTML = `<div class="mermaid-error">Error rendering diagram</div>`;
        }
      });
    }
  }, [content, enableMermaid]);

  const MermaidComponent = ({ children }: { children: string }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      if (mermaidRef.current && enableMermaid) {
        // Create a valid CSS selector ID (no dots, only alphanumeric and hyphens)
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000);
        const graphId = `mermaid-${timestamp}-${randomNum}`;

        try {
          mermaid.render(graphId, children).then(({ svg }) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
            }
          }).catch((error) => {
            console.error('Mermaid rendering error:', error);
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `<div class="mermaid-error">Error rendering diagram: ${error.message}</div>`;
            }
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<div class="mermaid-error">Error rendering diagram</div>`;
          }
        }
      }
    }, [children]);

    return <div ref={mermaidRef} className="mermaid-container" />;
  };

  // Reset error when content changes
  useEffect(() => {
    setRenderError(null);
  }, [content]);

  // Error boundary for markdown rendering
  const renderMarkdown = () => {
    try {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Handle code blocks
            code(props) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');
              const language = match && match[1];

              if (language === 'mermaid' && enableMermaid) {
                return <MermaidComponent>{String(children).replace(/\n$/, '')}</MermaidComponent>;
              }

              return (
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
            // Handle tables with minimal custom styling
            table(props) {
              const { children, ...rest } = props;
              return (
                <div className="table-wrapper">
                  <table className="markdown-table" {...rest}>{children}</table>
                </div>
              );
            },
            thead(props) {
              const { children, ...rest } = props;
              return <thead className="table-header" {...rest}>{children}</thead>;
            },
            tbody(props) {
              const { children, ...rest } = props;
              return <tbody className="table-body" {...rest}>{children}</tbody>;
            },
            tr(props) {
              const { children, ...rest } = props;
              return <tr className="table-row" {...rest}>{children}</tr>;
            },
            th(props) {
              const { children, ...rest } = props;
              return <th className="table-header-cell" {...rest}>{children}</th>;
            },
            td(props) {
              const { children, ...rest } = props;
              return <td className="table-cell" {...rest}>{children}</td>;
            },
            // Handle checkboxes for task lists
            input(props) {
              const { type, checked, ...rest } = props;
              if (type === 'checkbox') {
                return (
                  <input
                    type="checkbox"
                    checked={checked}
                    className="task-checkbox"
                    readOnly
                    {...rest}
                  />
                );
              }
              return <input type={type} checked={checked} {...rest} />;
            },
            // Handle links
            a(props) {
              const { href, children, ...rest } = props;
              return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link" {...rest}>
                  {children}
                </a>
              );
            },
            // Handle blockquotes
            blockquote(props) {
              const { children, ...rest } = props;
              return <blockquote className="markdown-blockquote" {...rest}>{children}</blockquote>;
            },
            // Handle headings
            h1(props) {
              const { children, ...rest } = props;
              return <h1 className="markdown-h1" {...rest}>{children}</h1>;
            },
            h2(props) {
              const { children, ...rest } = props;
              return <h2 className="markdown-h2" {...rest}>{children}</h2>;
            },
            h3(props) {
              const { children, ...rest } = props;
              return <h3 className="markdown-h3" {...rest}>{children}</h3>;
            },
            h4(props) {
              const { children, ...rest } = props;
              return <h4 className="markdown-h4" {...rest}>{children}</h4>;
            },
            h5(props) {
              const { children, ...rest } = props;
              return <h5 className="markdown-h5" {...rest}>{children}</h5>;
            },
            h6(props) {
              const { children, ...rest } = props;
              return <h6 className="markdown-h6" {...rest}>{children}</h6>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      );
    } catch (error) {
      console.error('Markdown rendering error:', error);
      setRenderError(error instanceof Error ? error.message : 'Unknown rendering error');
      return null;
    }
  };

  return (
    <div ref={containerRef} className="markdown-renderer">
      {renderError ? (
        <div className="markdown-error">
          <h3>Markdown Rendering Error</h3>
          <p>There was an error rendering the markdown content:</p>
          <pre>{renderError}</pre>
          <button
            onClick={() => setRenderError(null)}
            className="retry-button"
          >
            Try Again
          </button>
          <details>
            <summary>Raw Content</summary>
            <pre>{content}</pre>
          </details>
        </div>
      ) : (
        renderMarkdown()
      )}
    </div>
  );
};

export default MarkdownRenderer;