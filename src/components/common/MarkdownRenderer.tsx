import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, Code2 } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
  inline?: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ children, className = '', inline }) => {
  const [copied, setCopied] = useState(false);
  const codeString = String(children || '').replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/80 dark:border-indigo-800/60 font-mono text-[12px] text-indigo-700 dark:text-indigo-300 font-semibold">
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 text-slate-100 shadow-sm font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 font-semibold text-slate-300 uppercase tracking-wider">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-[10px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[12px] leading-relaxed text-slate-200">
        <code>{children}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Clean and normalize markdown string to ensure robust rendering without breaking CommonMark
  const normalizedContent = (content || '')
    .replace(/\r\n/g, '\n')
    // Fix loose bold/italic delimiters where inner whitespace breaks standard CommonMark matching:
    // e.g. *** text *** -> ***text***, ** text ** -> **text**
    .replace(/\*\*\*\s+([^*\n]+?)\s+\*\*\*/g, '***$1***')
    .replace(/\*\*\s+([^*\n]+?)\s+\*\*/g, '**$1**')
    .replace(/\*{4,}/g, '**');

  return (
    <div className={`markdown-body space-y-2.5 leading-relaxed text-sm ${className}`}>
      <Markdown
        components={{
          code({ className, children, ...props }: any) {
            const isInline = !Boolean(className && className.includes('language-')) && !String(children).includes('\n');
            return (
              <CodeBlock inline={isInline} className={className}>
                {children}
              </CodeBlock>
            );
          },
          h1({ children }: any) {
            return (
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 pt-2 pb-1 border-b border-slate-200/60 dark:border-slate-800">
                {children}
              </h1>
            );
          },
          h2({ children }: any) {
            return (
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 pt-2 pb-0.5">
                {children}
              </h2>
            );
          },
          h3({ children }: any) {
            return (
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 pt-1.5">
                {children}
              </h3>
            );
          },
          h4({ children }: any) {
            return (
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {children}
              </h4>
            );
          },
          p({ children }: any) {
            return (
              <p className="leading-relaxed text-slate-800 dark:text-slate-200 break-words">
                {children}
              </p>
            );
          },
          strong({ children }: any) {
            return (
              <strong className="font-bold text-slate-900 dark:text-white">
                {children}
              </strong>
            );
          },
          em({ children }: any) {
            return <em className="italic text-slate-800 dark:text-slate-200">{children}</em>;
          },
          ul({ children }: any) {
            return (
              <ul className="space-y-1.5 pl-5 list-disc text-slate-800 dark:text-slate-200 my-2">
                {children}
              </ul>
            );
          },
          ol({ children }: any) {
            return (
              <ol className="space-y-1.5 pl-5 list-decimal text-slate-800 dark:text-slate-200 my-2">
                {children}
              </ol>
            );
          },
          li({ children }: any) {
            return <li className="leading-relaxed pl-1">{children}</li>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="my-2 pl-3 py-1 border-l-2 border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-slate-700 dark:text-slate-300 italic rounded-r-md text-xs sm:text-sm">
                {children}
              </blockquote>
            );
          },
          table({ children }: any) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }: any) {
            return <thead className="bg-slate-50 dark:bg-slate-800/60">{children}</thead>;
          },
          tbody({ children }: any) {
            return <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{children}</tbody>;
          },
          th({ children }: any) {
            return (
              <th className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100">
                {children}
              </th>
            );
          },
          td({ children }: any) {
            return <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{children}</td>;
          },
          hr() {
            return <hr className="my-3 border-slate-200 dark:border-slate-800" />;
          },
        }}
      >
        {normalizedContent}
      </Markdown>
    </div>
  );
};
