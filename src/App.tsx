import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Navbar } from './components/Navbar';
import { FileSidebar } from './components/FileSidebar';
import { SummaryView } from './components/SummaryView';
import { ChatPanel } from './components/ChatPanel';
import { DocumentModal } from './components/DocumentModal';
import { LoggedOutView } from './components/LoggedOutView';
import { ApiKeyModal } from './components/ApiKeyModal';
import { 
  UploadedFile, 
  DocumentSummary, 
  ChatMessage, 
  SummaryPreset, 
  GoogleUserProfile 
} from './types';
import { 
  getSavedAuthUser, 
  saveAuthUser, 
  clearAuthUser, 
  loadUserSources, 
  saveUserSources, 
  loadUserChat, 
  saveUserChat, 
  loadUserSummary, 
  saveUserSummary, 
  loadUserSuggestedQuestions, 
  saveUserSuggestedQuestions, 
  loadUserSettings, 
  saveUserSettings, 
  loadUserApiKey, 
  saveUserApiKey,
  purgeLegacyGlobalStorage 
} from './utils/userDataStorage';
import { Menu, X, AlertCircle } from 'lucide-react';

const GEMINI_MODEL = 'gemini-3.8-flash';

const DEFAULT_SAMPLES: UploadedFile[] = [
  {
    id: 'sample-ai',
    name: 'Quantum AI Research Notes.md',
    size: '4 KB',
    type: 'text/markdown',
    uploadedAt: 'Preloaded',
    selected: true,
    isSample: true,
    textContent: 'Quantum-classical computing combines quantum processors with classical GPUs. Hybrid algorithms can help with molecular simulation, optimization, and complex search problems. Important engineering challenges include error correction, cooling requirements, hardware availability, and software interoperability.'
  },
  {
    id: 'sample-energy',
    name: 'Clean Energy Grid Notes.md',
    size: '3 KB',
    type: 'text/markdown',
    uploadedAt: 'Preloaded',
    selected: true,
    isSample: true,
    textContent: 'Modern clean-energy grids combine solar and wind generation with batteries, transmission upgrades, demand response, and smart-grid software. Main challenges include intermittency, transmission capacity, permitting, storage duration, and maintaining grid reliability.'
  }
];

function buildGeminiParts(files: UploadedFile[]) {
  const parts: any[] = [];
  for (const file of files) {
    if (file.data && file.type?.startsWith('image/')) {
      const data = file.data.includes(';base64,') ? file.data.split(';base64,')[1] : file.data;
      parts.push({ inlineData: { mimeType: file.type, data } });
      parts.push({ text: `[Image: ${file.name}]` });
    } else if (file.data && file.type?.includes('pdf')) {
      const data = file.data.includes(';base64,') ? file.data.split(';base64,')[1] : file.data;
      parts.push({ inlineData: { mimeType: 'application/pdf', data } });
      parts.push({ text: `[PDF: ${file.name}]` });
    } else {
      parts.push({
        text: `--- DOCUMENT: ${file.name} ---\n${file.textContent || ''}\n--- END DOCUMENT ---`
      });
    }
  }
  return parts;
}

export default function App() {
  // Authenticated user state
  const [user, setUser] = useState<GoogleUserProfile | null>(null);
  const activeUserRef = useRef<GoogleUserProfile | null>(null);

  // Application data state (Strictly scoped to user.sub)
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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // Track if initial load for current user has completed to prevent saving empty state over user data
  const isDataLoadedRef = useRef<boolean>(false);

  // Keep activeUserRef in sync
  useEffect(() => {
    activeUserRef.current = user;
  }, [user]);

  // 1. Initial Mount: Purge un-namespaced legacy keys and restore session if present
  useEffect(() => {
    purgeLegacyGlobalStorage();
    const savedUser = getSavedAuthUser();
    if (savedUser && savedUser.sub) {
      loadUserDataForAccount(savedUser);
    }
  }, []);

  // Helper: Load all account-specific data for a given Google sub
  const loadUserDataForAccount = (accountUser: GoogleUserProfile) => {
    isDataLoadedRef.current = false;

    // Clear previous in-memory state completely
    setFiles([]);
    setMessages([]);
    setSummary(null);
    setSuggestedQuestions([]);
    setErrorMessage(null);
    setInspectingFile(null);

    setUser(accountUser);
    activeUserRef.current = accountUser;

    const sub = accountUser.sub;

    // Load account sources
    const savedSources = loadUserSources(sub);
    if (savedSources && savedSources.length > 0) {
      setFiles(savedSources);
    } else {
      // First time for this Google account: initialize with clean samples
      const initial = DEFAULT_SAMPLES.map((f) => ({ ...f }));
      setFiles(initial);
      saveUserSources(sub, initial);
    }

    // Load chat history
    const savedChat = loadUserChat(sub);
    setMessages(savedChat || []);

    // Load summary
    const savedSummary = loadUserSummary(sub);
    setSummary(savedSummary);

    // Load suggested questions
    const savedQuestions = loadUserSuggestedQuestions(sub);
    setSuggestedQuestions(savedQuestions || []);

    // Load settings
    const savedSettings = loadUserSettings(sub);
    if (savedSettings.currentPreset) setCurrentPreset(savedSettings.currentPreset);
    if (savedSettings.customFocus !== undefined) setCustomFocus(savedSettings.customFocus);
    if (savedSettings.activeTab) setActiveTab(savedSettings.activeTab);

    // Mark that this user's data is now active in memory
    setTimeout(() => {
      isDataLoadedRef.current = true;
    }, 50);
  };

  // 2. Handle Google Sign-In Success
  const handleSignInSuccess = (signedInUser: GoogleUserProfile) => {
    saveAuthUser(signedInUser);
    loadUserDataForAccount(signedInUser);
  };

  // 3. Handle Sign Out
  const handleSignOut = () => {
    // Disable Google GIS auto-select if available
    try {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (e) {
      console.warn('GIS disableAutoSelect error:', e);
    }

    clearAuthUser();
    activeUserRef.current = null;
    isDataLoadedRef.current = false;

    // Clear in-memory application state
    setUser(null);
    setFiles([]);
    setMessages([]);
    setSummary(null);
    setSuggestedQuestions([]);
    setInspectingFile(null);
    setErrorMessage(null);
  };

  // 4. Per-account automatic persistence effects
  useEffect(() => {
    if (user?.sub && isDataLoadedRef.current) {
      saveUserSources(user.sub, files);
    }
  }, [files, user?.sub]);

  useEffect(() => {
    if (user?.sub && isDataLoadedRef.current) {
      saveUserChat(user.sub, messages);
    }
  }, [messages, user?.sub]);

  useEffect(() => {
    if (user?.sub && isDataLoadedRef.current) {
      saveUserSummary(user.sub, summary);
    }
  }, [summary, user?.sub]);

  useEffect(() => {
    if (user?.sub && isDataLoadedRef.current) {
      saveUserSuggestedQuestions(user.sub, suggestedQuestions);
    }
  }, [suggestedQuestions, user?.sub]);

  useEffect(() => {
    if (user?.sub && isDataLoadedRef.current) {
      saveUserSettings(user.sub, {
        currentPreset,
        customFocus,
        activeTab,
      });
    }
  }, [currentPreset, customFocus, activeTab, user?.sub]);

  // Helper to obtain account-isolated Gemini Client
  const getGeminiClientForUser = (): GoogleGenAI | null => {
    if (!user?.sub) {
      setErrorMessage('You must be signed in with a Google account to use Gemini.');
      return null;
    }

    const userKey = loadUserApiKey(user.sub);
    if (userKey) {
      return new GoogleGenAI({ apiKey: userKey });
    }

    // Check environment variable fallback if provided
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (envKey) {
      return new GoogleGenAI({ apiKey: envKey });
    }

    // Prompt user to configure their isolated API key
    setIsApiKeyModalOpen(true);
    setErrorMessage('Please enter your Gemini API key to proceed.');
    return null;
  };

  // Sample docs loader for the active user
  const handleLoadSampleDocs = () => {
    if (!user?.sub) return;
    const freshSamples = DEFAULT_SAMPLES.map((file) => ({ ...file }));
    setFiles(freshSamples);
    setSummary(null);
    setMessages([]);
    setSuggestedQuestions([]);
    setErrorMessage(null);
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
    if (!user?.sub) return;
    setFiles([]);
    setSummary(null);
    setMessages([]);
    setSuggestedQuestions([]);
  };

  const selectedFiles = files.filter((f) => f.selected);

  // Generate Document Summary directly in browser for the active Google account
  const handleGenerateSummary = async () => {
    if (!user?.sub) {
      setErrorMessage('Please sign in to generate document summaries.');
      return;
    }

    if (selectedFiles.length === 0) {
      setErrorMessage('Please select at least one document in the sidebar to summarize.');
      return;
    }

    const ai = getGeminiClientForUser();
    if (!ai) return;

    const callingSub = user.sub;
    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const promptText = `
You are an expert document intelligence assistant.
Analyze the supplied documents and return ONLY valid JSON with this exact shape:
{
  "title": "string",
  "executiveSummary": "string",
  "keyTakeaways": ["string"],
  "keyMetrics": [{"label":"string","value":"string","context":"string"}],
  "actionItems": ["string"],
  "topicBreakdown": [{"topic":"string","summary":"string"}],
  "suggestedQuestions": ["string"]
}
Mode: ${currentPreset}.
Additional focus: ${customFocus.trim() || 'None'}.
`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [...buildGeminiParts(selectedFiles), { text: promptText }],
        config: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      // Verify the active user hasn't switched during the async call
      if (activeUserRef.current?.sub !== callingSub) {
        console.warn('Account switched during summarization. Aborting state update to protect data isolation.');
        return;
      }

      const cleaned = (response.text || '{}').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const summaryData: DocumentSummary = JSON.parse(cleaned);
      setSummary(summaryData);
      setSuggestedQuestions(summaryData.suggestedQuestions || []);
    } catch (err: any) {
      console.error('Error summarizing:', err);
      if (activeUserRef.current?.sub === callingSub) {
        setErrorMessage(err?.message || 'Failed to generate document summary. Please check your API key.');
      }
    } finally {
      if (activeUserRef.current?.sub === callingSub) {
        setIsSummarizing(false);
      }
    }
  };

  // Send message directly to Gemini in browser for the active Google account
  const handleSendMessage = async (text: string) => {
    if (!user?.sub) {
      setErrorMessage('Please sign in to ask questions with Gemini.');
      return;
    }

    const ai = getGeminiClientForUser();
    if (!ai) return;

    const callingSub = user.sub;
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
      const history = messages.slice(-10).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const systemInstruction = `
You are Loomind, a document research assistant.
When documents are supplied, ground answers in them. If something is not in the documents, say so clearly.
Use clean Markdown and concise, useful explanations.
`;

      const contents: any[] = [];
      if (selectedFiles.length > 0) {
        contents.push({
          role: 'user',
          parts: [
            ...buildGeminiParts(selectedFiles),
            { text: 'These are the selected research sources for this conversation.' }
          ]
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'I have reviewed the selected sources and am ready to answer questions about them.' }]
        });
      }

      contents.push(...history);
      contents.push({ role: 'user', parts: [{ text }] });

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents,
        config: { systemInstruction, temperature: 0.3 }
      });

      // Verify the active user hasn't switched during the async call
      if (activeUserRef.current?.sub !== callingSub) {
        console.warn('Account switched during chat response. Aborting state update to protect data isolation.');
        return;
      }

      const assistantMsg: ChatMessage = {
        id: 'msg-ai-' + Date.now(),
        role: 'assistant',
        content: response.text || 'I could not produce a response. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      if (activeUserRef.current?.sub === callingSub) {
        setErrorMessage(err?.message || 'Failed to complete question. Please check your API key.');
        const errorReply: ChatMessage = {
          id: 'msg-err-' + Date.now(),
          role: 'assistant',
          content: `**Unable to complete response:** ${err?.message || 'An error occurred with Gemini.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorReply]);
      }
    } finally {
      if (activeUserRef.current?.sub === callingSub) {
        setIsChatLoading(false);
      }
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
        user={user}
        activeFileCount={selectedFiles.length}
        totalFileCount={files.length}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onClearAll={handleClearAll}
        onLoadSamples={handleLoadSampleDocs}
        onSignOut={handleSignOut}
        onSignInSuccess={handleSignInSuccess}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Error Banner */}
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

      {/* Logged Out Screen: When no user is authenticated */}
      {!user ? (
        <main className="flex-1 h-full overflow-hidden">
          <LoggedOutView
            onSignInSuccess={handleSignInSuccess}
            onSignInError={(err) => setErrorMessage(err?.message || 'Sign in failed')}
          />
        </main>
      ) : (
        /* Authenticated Workspace Screen */
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Sidebar Toggle Button */}
          <div className="lg:hidden p-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <Menu className="w-4 h-4" />
              <span>{sidebarOpen ? 'Close Sources' : `Sources & Files (${selectedFiles.length})`}</span>
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Q&amp;A
              </button>
            </div>
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
        </div>
      )}

      {/* Document Inspector Modal */}
      <DocumentModal
        file={inspectingFile}
        onClose={() => setInspectingFile(null)}
      />

      {/* Gemini API Key Modal for this specific user */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        user={user}
        onKeySaved={() => {
          setErrorMessage(null);
        }}
      />
    </div>
  );
}
