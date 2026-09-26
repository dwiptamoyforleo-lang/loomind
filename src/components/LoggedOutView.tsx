import React from 'react';
import { Sparkles, ShieldCheck, FileText, Bot, Layers, Lock } from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { GoogleUserProfile } from '../types';

interface LoggedOutViewProps {
  onSignInSuccess: (user: GoogleUserProfile) => void;
  onSignInError?: (err: any) => void;
}

export const LoggedOutView: React.FC<LoggedOutViewProps> = ({
  onSignInSuccess,
  onSignInError,
}) => {
  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full my-auto py-8">
        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-sky-500/10 dark:bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/25 mb-5">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Secure Per-Account Research Workspaces</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome to Loomind
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-3 leading-relaxed">
            Your personal multimodal research notebook with AI document summarization, PDF deep dives, and universal Q&A powered by Gemini.
          </p>

          {/* Sign In Card */}
          <div className="mt-8 p-6 max-w-md mx-auto rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-xs">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Sign in with your Google account
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-normal">
              Your sources, notes, chat transcripts, and settings are saved strictly to your Google account ID.
            </p>

            <div className="flex justify-center">
              <GoogleSignInButton
                onSuccess={onSignInSuccess}
                onError={onSignInError}
                text="continue_with"
                size="large"
                shape="pill"
                theme="outline"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>Strict account data isolation • No shared storage</span>
            </div>
          </div>

          {/* Value Props Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-left">
            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Multimodal Source Ingestion
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Upload PDFs, notes, markdown, code, research briefs, or paste custom text directly.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-2.5">
                <Layers className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                5 Summarization Styles
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Executive briefs, deep analytical dives, actionable next steps, ELI5, and study guides.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-2.5">
                <Bot className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Ask Gemini Q&A
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Multi-turn conversation grounded in your files with citations, tables, and metric breakdowns.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 pb-2">
        Loomind &copy; 2026 • Powered by Google Gemini &amp; Google Identity Services
      </div>
    </div>
  );
};
