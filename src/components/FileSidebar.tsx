import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  FileCode, 
  Image as ImageIcon, 
  Trash2, 
  CheckSquare, 
  Square, 
  PlusCircle, 
  Sparkles, 
  Eye, 
  X,
  FileCheck2,
  FilePlus,
  BookOpen
} from 'lucide-react';
import { UploadedFile } from '../types';
import { formatFileSize, readFileAsBase64, readFileAsText, isTextFileType } from '../utils/fileHelpers';

interface FileSidebarProps {
  files: UploadedFile[];
  onAddFiles: (files: UploadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onViewFile: (file: UploadedFile) => void;
  onLoadSamples: () => void;
}

export const FileSidebar: React.FC<FileSidebarProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onToggleSelect,
  onSelectAll,
  onViewFile,
  onLoadSamples,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingTextDoc, setIsAddingTextDoc] = useState(false);
  const [textDocTitle, setTextDocTitle] = useState('');
  const [textDocContent, setTextDocContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFileList = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const isText = isTextFileType(file);
        let base64Data: string | undefined;
        let textContent: string | undefined;

        if (isText) {
          textContent = await readFileAsText(file);
        } else {
          base64Data = await readFileAsBase64(file);
        }

        newFiles.push({
          id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type || 'text/plain',
          data: base64Data,
          textContent: textContent,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          selected: true,
        });
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (newFiles.length > 0) {
      onAddFiles(newFiles);
    }
    setIsProcessing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddCustomTextDoc = () => {
    if (!textDocTitle.trim() || !textDocContent.trim()) return;

    const newDoc: UploadedFile = {
      id: 'doc-' + Date.now(),
      name: textDocTitle.trim().endsWith('.txt') || textDocTitle.trim().endsWith('.md') 
        ? textDocTitle.trim() 
        : `${textDocTitle.trim()}.md`,
      size: formatFileSize(new Blob([textDocContent]).size),
      type: 'text/markdown',
      textContent: textDocContent,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selected: true,
    };

    onAddFiles([newDoc]);
    setTextDocTitle('');
    setTextDocContent('');
    setIsAddingTextDoc(false);
  };

  const getFileIcon = (file: UploadedFile) => {
    const type = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (type.includes('pdf') || name.endsWith('.pdf')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-xs">
          PDF
        </div>
      );
    }
    if (type.startsWith('image/')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
          <ImageIcon className="w-4 h-4" />
        </div>
      );
    }
    if (name.endsWith('.json') || name.endsWith('.csv') || name.endsWith('.py') || name.endsWith('.ts') || name.endsWith('.js')) {
      return (
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <FileCode className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
        <FileText className="w-4 h-4" />
      </div>
    );
  };

  const allSelected = files.length > 0 && files.every((f) => f.selected);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/70 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" />
            Sources & Files
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {files.length} document{files.length === 1 ? '' : 's'} added
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => onSelectAll(!allSelected)}
            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
          >
            {allSelected ? (
              <>
                <CheckSquare className="w-3.5 h-3.5" /> Deselect
              </>
            ) : (
              <>
                <Square className="w-3.5 h-3.5" /> Select All
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload Dropzone */}
      <div className="p-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white/70 dark:bg-slate-800/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".pdf,application/pdf,image/*,.txt,.md,.json,.csv,.py,.js,.ts,.html,.log,.yaml,.yml"
            className="hidden"
          />

          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {isProcessing ? 'Processing files...' : 'Click or drop files here'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            PDFs, images, TXT, markdown, data, code
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-2 mt-2.5">
          <button
            onClick={() => setIsAddingTextDoc(true)}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-xs transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Paste Text</span>
          </button>

          <button
            onClick={onLoadSamples}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-medium shadow-xs transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Sample Docs</span>
          </button>
        </div>
      </div>

      {/* Custom Text/Notes Modal */}
      {isAddingTextDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 border border-slate-200 dark:border-slate-700 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Add Document from Text / Notes
              </h3>
              <button
                onClick={() => setIsAddingTextDoc(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={textDocTitle}
                  onChange={(e) => setTextDocTitle(e.target.value)}
                  placeholder="e.g. Meeting Minutes, Project Spec, Research Notes"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Text Content or Paste File
                </label>
                <textarea
                  value={textDocContent}
                  onChange={(e) => setTextDocContent(e.target.value)}
                  rows={8}
                  placeholder="Paste article, transcript, notes, or report content here..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsAddingTextDoc(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomTextDoc}
                disabled={!textDocTitle.trim() || !textDocContent.trim()}
                className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shadow-xs"
              >
                Add as Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {files.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/40 dark:bg-slate-800/20">
            <Sparkles className="w-8 h-8 text-indigo-400 mb-2 opacity-70" />
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
              No documents yet
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
              Upload PDFs or click "Sample Docs" to test instant summarization & Q&A.
            </p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className={`group relative rounded-xl p-3 border transition-all ${
                file.selected
                  ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                  : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Select Checkbox */}
                <button
                  onClick={() => onToggleSelect(file.id)}
                  title={file.selected ? 'Uncheck to exclude from AI context' : 'Check to include in AI context'}
                  className="mt-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {file.selected ? (
                    <FileCheck2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {/* File Icon */}
                {getFileIcon(file)}

                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.uploadedAt}</span>
                    {file.isSample && (
                      <>
                        <span>•</span>
                        <span className="text-[10px] text-indigo-500 font-medium">Sample</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onViewFile(file)}
                    title="Inspect file content"
                    className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveFile(file.id)}
                    title="Remove file"
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
