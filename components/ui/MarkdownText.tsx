import ReactMarkdown from 'react-markdown';

interface Props {
  children: string;
  className?: string;
}

export default function MarkdownText({ children, className = '' }: Props) {
  return (
    <div className={`text-base leading-relaxed text-nordic-muted dark:text-gray-300 ${className}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-nordic-dark dark:text-white">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-mosque dark:text-primary underline hover:no-underline"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="text-2xl font-bold text-nordic-dark dark:text-white mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold text-nordic-dark dark:text-white mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold text-nordic-dark dark:text-white mb-2">{children}</h3>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-sm font-mono">{children}</code>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
