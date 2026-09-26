import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Target, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  HelpCircle, 
  SlidersHorizontal,
  ChevronRight,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { DocumentSummary, SummaryPreset, UploadedFile } from '../types';

interface SummaryViewProps {
  summary: DocumentSummary | null;
  isLoading: boolean;
  selectedFiles: UploadedFile[];
  currentPreset: SummaryPreset;
  customFocus: string;
  onPresetChange: (preset: SummaryPreset) => void;
  onCustomFocusChange: (focus: string) => void;
  onGenerateSummary: () => void;
  onAskQuestionInChat: (question: string) => void;
  onLoadSamples: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  summary,
  isLoading,
  selectedFiles,
  currentPreset,
  customFocus,
  onPresetChange,
  onCustomFocusChange,
  onGenerateSummary,
  onAskQuestionInChat,
  onLoadSamples,
}) => {
  const [copied, setCopied] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<number, boolean>>({});

  const presets: Array<{ id: SummaryPreset; label: string; desc: string }> = [
    { id: 'executive', label: 'Executive Brief', desc: 'Strategic high-level takeaway & decision points' },
    { id: 'deep_dive', label: 'Deep Dive', desc: 'Exhaustive analytical breakdown & nuances' },
    { id: 'actionable', label: 'Action & Metrics', desc: 'Key statistics, targets & concrete next steps' },
    { id: 'eli5', label: 'Plain Language', desc: 'Simplified clear explanations without dense jargon' },
    { id: 'study_guide', label: 'Study Guide', desc: 'Key definitions & knowledge check questions' },
  ];

  const handleCopySummary = () => {
    if (!summary) return;
    const text = `# ${summary.title}\n\n## Executive Summary\n${summary.executiveSummary}\n\n## Key Takeaways\n${summary.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n## Key Metrics\n${summary.keyMetrics.map((m) => `- **${m.label}**: ${m.value} (${m.context || ''})`).join('\n')}\n\n## Action Items\n${summary.actionItems.map((a) => `- [ ] ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!summary) return;
    const text = `# ${summary.title}\n\n## Executive Summary\n${summary.executiveSummary}\n\n## Key Takeaways\n${summary.keyTakeaways.map((t) => `- ${t}`).join('\n')}\n\n## Key Metrics\n${summary.keyMetrics.map((m) => `- **${m.label}**: ${m.value} (${m.context || ''})`).join('\n')}\n\n## Action Items\n${summary.actionItems.map((a) => `- [ ] ${a}`).join('\n')}\n\n## Topic Breakdown\n${summary.topicBreakdown.map((tb) => `### ${tb.topic}\n${tb.summary}`).join('\n\n')}`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}_summary.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAction = (idx: number) => {
    setCompletedActions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6">
      {/* Control Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              AI Document Summarizer
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your briefing style and customize focus to extract the most critical insights with Gemini 3.8.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onGenerateSummary}
              disabled={isLoading || selectedFiles.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-600 hover:from-indigo-700 hover:to-sky-700 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Analyzing Documents...' : summary ? 'Regenerate Summary' : 'Generate Summary'}</span>
            </button>
          </div>
        </div>

        {/* Presets and Custom Focus */}
        <div className="pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Preset:
            </span>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onPresetChange(preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  currentPreset === preset.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customFocus}
              onChange={(e) => onCustomFocusChange(e.target.value)}
              placeholder="Optional: custom focus (e.g., 'focus on financial risks and timeline milestones')"
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 rounded-full bg-indigo-200 dark:bg-indigo-900/60" />
            <div className="h-6 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>
          <div className="space-y-2.5">
            <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-4 w-4/6 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="h-20 bg-slate-100 dark:bg-slate-750 rounded-xl" />
            <div className="h-20 bg-slate-100 dark:bg-slate-750 rounded-xl" />
            <div className="h-20 bg-slate-100 dark:bg-slate-750 rounded-xl" />
          </div>
        </div>
      )}

      {/* Empty State when no summary and not loading */}
      {!summary && !isLoading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 border border-slate-200 dark:border-slate-700 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 shadow-inner">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Ready to summarize your documents
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            {selectedFiles.length > 0
              ? `You have ${selectedFiles.length} file(s) selected in the sidebar. Click "Generate Summary" above to start analyzing.`
              : 'Add your PDFs, research papers, notes, or code in the sidebar, or load one of our pre-built samples to test.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {selectedFiles.length > 0 ? (
              <button
                onClick={onGenerateSummary}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Generate Summary Now
              </button>
            ) : (
              <button
                onClick={onLoadSamples}
                className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Load Sample Documents</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Content */}
      {summary && !isLoading && (
        <div className="space-y-6">
          {/* Main Title & Action Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Gemini Synthesis Complete
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {summary.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Synthesized across {selectedFiles.length} source file(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Narrative Executive Summary */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Executive Overview
              </h3>
              <p className="text-sm md:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                {summary.executiveSummary}
              </p>
            </div>
          </div>

          {/* Key Metrics / Highlights Grid */}
          {summary.keyMetrics && summary.keyMetrics.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                Key Figures & Metrics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {summary.keyMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                      {metric.label}
                    </p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tracking-tight">
                      {metric.value}
                    </p>
                    {metric.context && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">
                        {metric.context}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {summary.keyTakeaways && summary.keyTakeaways.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Core Key Takeaways
              </h3>

              <div className="space-y-2.5">
                {summary.keyTakeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {takeaway}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Breakdown */}
          {summary.topicBreakdown && summary.topicBreakdown.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-violet-500" />
                Topic & Section Breakdown
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {summary.topicBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.topic}
                      </h4>
                      <button
                        onClick={() => onAskQuestionInChat(`Explain the details regarding "${item.topic}" from the documents.`)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Ask deeper <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items & Recommendations */}
          {summary.actionItems && summary.actionItems.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" />
                Actionable Next Steps & Next Milestones
              </h3>

              <div className="space-y-2">
                {summary.actionItems.map((action, idx) => {
                  const isChecked = !!completedActions[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleAction(idx)}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 line-through opacity-70'
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAction(idx)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-xs md:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                        {action}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Suggested Follow-up Questions */}
          {summary.suggestedQuestions && summary.suggestedQuestions.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/70 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-950/30 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/60 shadow-sm">
              <h3 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Suggested Questions to Ask About This
              </h3>

              <div className="flex flex-wrap gap-2">
                {summary.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAskQuestionInChat(q)}
                    className="group flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-indigo-100 dark:border-slate-700 shadow-xs hover:border-indigo-300 transition-all text-left"
                  >
                    <span>{q}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
