import React, { useState } from 'react';
import { X, FileText, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { UploadedFile } from '../types';

interface DocumentModalProps {
  file: UploadedFile | null;
  onClose: () => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({ file, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!file) return null;

  const isPdf = file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type.includes('pdf'));
  const isImage = file.type && file.type.startsWith('image/');
  const hasText = !!file.textContent;

  const handleCopyContent = () => {
    if (file.textContent) {
      navigator.clipboard.writeText(file.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (file.data) {
      const a = document.createElement('a');
      a.href = file.data;
      a.download = file.name;
      a.click();
    } else if (file.textContent) {
      const blob = new Blob([file.textContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 shadow-2xl animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                {file.name}
              </h3>
              <p className="text-xs text-slate-400">
                {file.size} • {file.type || 'Document'} • Added {file.uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasText && (
              <button
                onClick={handleCopyContent}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy content"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50">
          {isImage && file.data && (
            <div className="flex justify-center">
              <img
                src={file.data}
                alt={file.name}
                className="max-h-[60vh] rounded-xl object-contain shadow-md"
              />
            </div>
          )}

          {isPdf && file.data && (
            <div className="h-[60vh] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
              <iframe
                src={file.data}
                title={file.name}
                className="w-full h-full"
              />
            </div>
          )}

          {hasText && (
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {file.textContent}
            </div>
          )}

          {!hasText && !isPdf && !isImage && (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p className="text-sm font-medium">Binary Document Loaded</p>
              <p className="text-xs text-slate-400 mt-1">
                Content is indexed and ready for Gemini analysis and question answering.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
