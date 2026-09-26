import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FileSidebar } from './components/FileSidebar';
import { SummaryView } from './components/SummaryView';
import { ChatPanel } from './components/ChatPanel';
import { DocumentModal } from './components/DocumentModal';
import { UploadedFile, DocumentSummary, ChatMessage, SummaryPreset } from './types';
import { Menu, X, AlertCircle } from 'lucide-react';

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'chat'>('summary');
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [currentPreset, setCurrentPreset] = useState<SummaryPreset>('executive');
  const [customFocus, setCustomFocus] = useState<string>('');
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  
  const [inspectingFile, setInspectingFile] = useState<UploadedFile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-load sample documents on first mount if empty so the user can immediately experience the app
  useEffect(() => {
    handleLoadSampleDocs();
  }, []);

  const handleLoadSampleDocs = async () => {
    try {
      const res = await fetch('/api/sample-docs');
      if (!res.ok) throw new Error('Could not fetch sample documents');
      const data = await res.json();
      if (data.samples && data.samples.length > 0) {
        const loaded: UploadedFile[] = data.samples.map((s: any) => ({
          id: s.id,
          name: s.name,
          size: s.size,
          type: s.type,
          textContent: s.textContent,
          uploadedAt: 'Preloaded',
          selected: true,
          isSample: true,
        }));
        setFiles(loaded);
      }
    } catch (err) {
      console.error('Error loading sample documents:', err);
    }
  };

  const handleAddFiles = (newFiles: UploadedFile[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleToggleSelect = (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setFiles((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  const handleClearAll = () => {
    setFiles([]);
    setSummary(null);
    setMessages([]);
    setSuggestedQuestions([]);
  };

  const selectedFiles = files.filter((f) => f.selected);

  // Generate Document Summary
  const handleGenerateSummary = async () => {
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one document in the sidebar to summarize.');
      return;
    }

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const payloadFiles = selectedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        data: f.data,
        textContent: f.textContent,
      }));

      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: payloadFiles,
          preset: currentPreset,
          customFocus: customFocus.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Summarization failed with status ${res.status}`);
      }

      const summaryData: DocumentSummary = await res.json();
      setSummary(summaryData);
      if (summaryData.suggestedQuestions && summaryData.suggestedQuestions.length > 0) {
        setSuggestedQuestions(summaryData.suggestedQuestions);
      }
    } catch (err: any) {
      console.error('Error summarizing:', err);
      setErrorMessage(err.message || 'Failed to generate document summary. Please try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Send message to Gemini Chat
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);
    setErrorMessage(null);

    try {
      const payloadFiles = selectedFiles.map((f) => ({
        name: f.name,
        type: f.type,
        data: f.data,
        textContent: f.textContent,
      }));

      // Send recent history for multi-turn context
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          files: payloadFiles,
          question: text,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Chat error: ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err.message || 'Failed to complete question. Please try again.');
      const errorReply: ChatMessage = {
        id: 'msg-err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ **Unable to complete response**: ${err.message || 'An error occurred with the Gemini API.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleAskQuestionInChat = (question: string) => {
    setActiveTab('chat');
    handleSendMessage(question);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans">
      {/* Top Navigation */}
      <Navbar
        activeFileCount={selectedFiles.length}
        totalFileCount={files.length}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onClearAll={handleClearAll}
        onLoadSamples={handleLoadSampleDocs}
      />

      {/* Error Banner if any */}
      {errorMessage && (
        <div className="bg-rose-500 text-white px-4 py-2 text-xs flex items-center justify-between z-40 animate-in slide-in-from-top">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white hover:text-rose-100 font-bold ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Sidebar Toggle Button */}
      <div className="lg:hidden p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <Menu className="w-4 h-4" />
          <span>{sidebarOpen ? 'Close Sources' : `Sources & Files (${selectedFiles.length})`}</span>
        </button>

        <span className="text-xs text-slate-500">
          Tab: {activeTab === 'summary' ? 'Summary Report' : 'Gemini Q&A'}
        </span>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Sources & File Upload */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-30 w-80 md:w-88 shrink-0 h-full transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="h-full relative">
            {sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden absolute top-3 right-3 p-1 rounded-lg bg-slate-200 dark:bg-slate-750 text-slate-600 dark:text-slate-200 z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <FileSidebar
              files={files}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
              onToggleSelect={handleToggleSelect}
              onSelectAll={handleSelectAll}
              onViewFile={(f) => setInspectingFile(f)}
              onLoadSamples={handleLoadSampleDocs}
            />
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs"
          />
        )}

        {/* Right Main Panel: Summary View or Chat Panel */}
        <main className="flex-1 h-full overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
          {activeTab === 'summary' ? (
            <SummaryView
              summary={summary}
              isLoading={isSummarizing}
              selectedFiles={selectedFiles}
              currentPreset={currentPreset}
              customFocus={customFocus}
              onPresetChange={(preset) => setCurrentPreset(preset)}
              onCustomFocusChange={(focus) => setCustomFocus(focus)}
              onGenerateSummary={handleGenerateSummary}
              onAskQuestionInChat={handleAskQuestionInChat}
              onLoadSamples={handleLoadSampleDocs}
            />
          ) : (
            <ChatPanel
              messages={messages}
              isLoading={isChatLoading}
              selectedFiles={selectedFiles}
              onSendMessage={handleSendMessage}
              onClearChat={() => setMessages([])}
              suggestedQuestions={suggestedQuestions}
            />
          )}
        </main>
      </div>

      {/* Document Inspector Modal */}
      <DocumentModal
        file={inspectingFile}
        onClose={() => setInspectingFile(null)}
      />
    </div>
  );
}
