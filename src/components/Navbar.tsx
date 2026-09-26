import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  FileText, 
  Bot, 
  BookOpen, 
  Trash2, 
  LogOut, 
  Key, 
  User, 
  ChevronDown, 
  ShieldCheck, 
  Layers
} from 'lucide-react';
import { GoogleUserProfile } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  user: GoogleUserProfile | null;
  activeFileCount: number;
  totalFileCount: number;
  activeTab: 'summary' | 'chat';
  onTabChange: (tab: 'summary' | 'chat') => void;
  onClearAll: () => void;
  onLoadSamples: () => void;
  onSignOut: () => void;
  onSignInSuccess: (user: GoogleUserProfile) => void;
  onOpenApiKeyModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeFileCount,
  totalFileCount,
  activeTab,
  onTabChange,
  onClearAll,
  onLoadSamples,
  onSignOut,
  onSignInSuccess,
  onOpenApiKeyModal,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-colors">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg md:text-xl text-slate-900 dark:text-white tracking-tight">
              Loomind
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Gemini 3.8
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Multimodal Research Notebook &amp; Universal Q&amp;A
          </p>
        </div>
      </div>

      {/* Center Tabs (only if signed in) */}
      {user && (
        <div className="hidden sm:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onTabChange('summary')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
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
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Ask Gemini Q&amp;A</span>
          </button>
        </div>
      )}

      {/* Right Controls & User Profile */}
      <div className="flex items-center space-x-2">
        {user ? (
          <>
            {/* Action buttons on desktop */}
            <div className="hidden lg:flex items-center space-x-2 pr-2 border-r border-slate-200 dark:border-slate-800">
              {totalFileCount === 0 && (
                <button
                  onClick={onLoadSamples}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/60"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Load Samples</span>
                </button>
              )}

              {totalFileCount > 0 && (
                <button
                  onClick={onClearAll}
                  title="Remove all uploaded files in this workspace"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                {activeFileCount} / {totalFileCount} sources
              </div>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                title={`Signed in as ${user.name} (${user.email})`}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-indigo-500/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                )}
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate hidden md:inline">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-3 px-3 z-50 animate-in fade-in zoom-in-95">
                  {/* Account Header */}
                  <div className="flex items-center space-x-3 pb-3 mb-2 border-b border-slate-100 dark:border-slate-700/80">
                    {user.picture ? (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Sub ID confirmation badge */}
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 mb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> Google sub ID:
                      </span>
                      <span className="font-mono">{user.sub.slice(0, 8)}...</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      All sources &amp; chats are stored exclusively in this account's namespace.
                    </p>
                  </div>

                  {/* Settings / API Key Button */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenApiKeyModal();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors text-left"
                  >
                    <Key className="w-4 h-4 text-indigo-500" />
                    <span>Manage Gemini API Key</span>
                  </button>

                  {/* Sign Out Button */}
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-left mt-1"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out of Loomind</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* When logged out, render quick sign-in button */
          <div className="flex items-center">
            <GoogleSignInButton
              onSuccess={onSignInSuccess}
              text="signin_with"
              size="medium"
              shape="pill"
              theme="outline"
              width={160}
            />
          </div>
        )}
      </div>
    </header>
  );
};
