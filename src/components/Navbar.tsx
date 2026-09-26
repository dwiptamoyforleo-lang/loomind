import React from 'react';
import { Sparkles, FileText, Bot, BookOpen, Trash2 } from 'lucide-react';

interface NavbarProps {
  activeFileCount: number;
  totalFileCount: number;
  activeTab: 'summary' | 'chat';
  onTabChange: (tab: 'summary' | 'chat') => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeFileCount,
  totalFileCount,
  activeTab,
  onTabChange,
  onClearAll,
  onLoadSamples,
}) => {
  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
              Gemini Notebook
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Multimodal Document Summarization & Universal Q&A
          </p>
        </div>
      </div>

      {/* Navigation tabs for mobile / desktop view */}
      <div className="flex items-center space-x-2">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onTabChange('summary')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Summary</span>
          </button>
          <button
            onClick={() => onTabChange('chat')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Ask Gemini Q&A</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="hidden lg:flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          {totalFileCount === 0 && (
            <button
              onClick={onLoadSamples}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/60"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Load Sample Files</span>
            </button>
          )}

          {totalFileCount > 0 && (
            <button
              onClick={onClearAll}
              title="Remove all uploaded files and reset"
              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            {activeFileCount} / {totalFileCount} active sources
          </div>
        </div>
      </div>
    </header>
  );
};
