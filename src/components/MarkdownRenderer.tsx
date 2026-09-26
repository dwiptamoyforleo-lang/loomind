import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    try {
      // Configure marked
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content || '') as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-sm md:prose-base dark:prose-invert max-w-none 
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:dark:text-white [&_h1]:mb-3 [&_h1]:mt-4
        [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:dark:text-white [&_h2]:mb-2 [&_h2]:mt-3
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:dark:text-slate-100 [&_h3]:mb-2 [&_h3]:mt-3
        [&_p]:text-slate-700 [&_p]:dark:text-slate-300 [&_p]:leading-relaxed [&_p]:mb-3
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-slate-700 [&_ul]:dark:text-slate-300 [&_ul]:space-y-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-slate-700 [&_ol]:dark:text-slate-300 [&_ol]:space-y-1
        [&_li]:leading-relaxed
        [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:dark:text-slate-300 [&_blockquote]:bg-slate-50 [&_blockquote]:dark:bg-slate-800/50 [&_blockquote]:rounded-r
        [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_table]:text-sm
        [&_th]:bg-slate-100 [&_th]:dark:bg-slate-800 [&_th]:border [&_th]:border-slate-300 [&_th]:dark:border-slate-700 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-semibold
        [&_td]:border [&_td]:border-slate-300 [&_td]:dark:border-slate-700 [&_td]:p-2.5
        [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-indigo-600 [&_code]:dark:text-indigo-400 [&_code]:font-mono [&_code]:text-xs
        [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-3
        [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-slate-100 [&_pre_code]:text-xs
        [&_strong]:font-semibold [&_strong]:text-slate-900 [&_strong]:dark:text-white
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
