import React, { useState } from 'react';
import {
  Flame,
  Pin,
  Sparkles,
  ExternalLink,
  Download,
  Eye,
  ChevronRight,
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon
} from 'lucide-react';
import AskFileDialog from '../AskFileDialog/AskFileDialog';
import { triggerDownload } from '../../utils/downloadUtil';

const getQuickIcon = (fileName) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext)) {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (['doc', 'docx'].includes(ext)) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  }
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
    return <ImageIcon className="h-4 w-4 text-purple-500" />;
  }
  if (['zip', 'rar'].includes(ext)) {
    return <FileArchive className="h-4 w-4 text-amber-500" />;
  }
  return <FileCode className="h-4 w-4 text-emerald-500" />;
};

const ImportantFilesShelf = ({
  importantFiles = [],
  onTogglePin,
  onFileAccessed
}) => {
  const [selectedFileForAsk, setSelectedFileForAsk] = useState(null);

  if (!importantFiles || importantFiles.length === 0) {
    return null;
  }

  return (
    <div id="important-files-shelf" className="mb-8">
      {/* Shelf Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Important & Quick Access
              </h2>
              <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                Max-Heap DSA (AR-4)
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Ranked dynamically by access frequency, recency, and user pins
            </p>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {importantFiles.map((file) => {
          const isPinned = Boolean(file.isPinned);
          const priorityScore = file.priorityScore || 0;

          return (
            <div
              key={file._id}
              id={`important-card-${file._id}`}
              className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-900/50"
            >
              <div>
                {/* Badges Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Priority Score Pill */}
                    <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-50 to-orange-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:from-amber-950/50 dark:to-orange-950/50 dark:text-amber-300">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {priorityScore} pts
                    </span>

                    {/* Pin Status Pill */}
                    {isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                        <Pin className="h-2.5 w-2.5" />
                        Pinned
                      </span>
                    )}
                  </div>

                  {/* Views counter */}
                  <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
                    <Eye className="h-3 w-3" />
                    {file.accessCount || 0} views
                  </span>
                </div>

                {/* File Title & Icon */}
                <div className="mt-3 flex items-start gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-slate-800">
                    {getQuickIcon(file.fileName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="truncate text-xs font-bold text-gray-900 dark:text-white"
                      title={file.fileName}
                    >
                      {file.fileName}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {file.category || 'General'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-2.5 dark:border-slate-800/80">
                <div className="flex items-center gap-1">
                  {/* Pin / Unpin Button */}
                  <button
                    id={`btn-shelf-pin-${file._id}`}
                    type="button"
                    onClick={() => onTogglePin(file._id)}
                    title={isPinned ? 'Unpin file' : 'Pin to top (+500 pts)'}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition ${
                      isPinned
                        ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300'
                    }`}
                  >
                    <Pin className="h-3.5 w-3.5" />
                  </button>

                  {/* Open external view */}
                  <a
                    href={file.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (onFileAccessed) onFileAccessed(file._id);
                    }}
                    title="Open document"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Download */}
                  <button
                    type="button"
                    id={`btn-shelf-download-${file._id}`}
                    onClick={() => {
                      if (onFileAccessed) onFileAccessed(file._id);
                      triggerDownload(file.cloudinaryUrl, file.fileName);
                    }}
                    title="Download document"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-slate-800 dark:hover:text-gray-300"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onFileAccessed) onFileAccessed(file._id);
                    setSelectedFileForAsk(file);
                  }}
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-indigo-600 transition hover:text-indigo-500 dark:text-indigo-400"
                >
                  <span>Quick Q&A</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ask File Modal */}
      {selectedFileForAsk && (
        <AskFileDialog
          isOpen={Boolean(selectedFileForAsk)}
          onClose={() => setSelectedFileForAsk(null)}
          file={selectedFileForAsk}
        />
      )}
    </div>
  );
};

export default ImportantFilesShelf;
