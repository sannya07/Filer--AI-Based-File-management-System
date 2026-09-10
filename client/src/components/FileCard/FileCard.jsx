import React, { useState } from 'react';
import { formatFileSize } from '../../utils/hashUtil';
import ShareModal from '../ShareModal/ShareModal';
import {
  FileText,
  FileCode,
  FileArchive,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Trash2,
  Tag,
  Clock,
  HardDrive,
  FolderInput,
  Share2,
  Check,
  X
} from 'lucide-react';

const getFileIcon = (fileName, fileType) => {
  const ext = fileName?.split('.').pop()?.toLowerCase();

  if (['pdf'].includes(ext)) {
    return {
      icon: <FileText className="h-6 w-6 text-red-500" />,
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/40',
      badge: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
    };
  }
  if (['doc', 'docx'].includes(ext)) {
    return {
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
    };
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) {
    return {
      icon: <ImageIcon className="h-6 w-6 text-purple-500" />,
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/40',
      badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
    };
  }
  if (['zip', 'rar', 'tar', 'gz'].includes(ext)) {
    return {
      icon: <FileArchive className="h-6 w-6 text-amber-500" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
    };
  }
  if (['csv', 'txt', 'json'].includes(ext)) {
    return {
      icon: <FileCode className="h-6 w-6 text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40',
      badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
    };
  }

  return {
    icon: <FileText className="h-6 w-6 text-indigo-500" />,
    bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40',
    badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
  };
};

const FileCard = ({ file, onDelete, onMove, categoryTree = [] }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTargetCat, setSelectedTargetCat] = useState(file.category || 'Others');
  const [selectedTargetSubcat, setSelectedTargetSubcat] = useState(file.subcategory || '');

  const { icon, bg, badge } = getFileIcon(file.fileName, file.fileType);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(file._id);
    } catch (error) {
      console.error('Delete failed:', error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleMoveSubmit = async (e) => {
    e.preventDefault();
    if (!onMove) return;
    try {
      await onMove(file._id, selectedTargetCat, selectedTargetSubcat);
      setIsMoving(false);
    } catch (error) {
      console.error('Failed to move file:', error);
    }
  };

  const formattedDate = new Date(file.uploadedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Find subcategories for selected target category
  const activeParentNode = categoryTree.find((node) => node.name === selectedTargetCat);
  const availableSubcategories = activeParentNode?.children || [];

  return (
    <div
      id={`file-card-${file._id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div>
        {/* Header: Icon & Category Hierarchy */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${bg} transition group-hover:scale-105`}
          >
            {icon}
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              {file.confidence && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {file.confidence}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${badge}`}
              >
                {file.category || 'Others'}
              </span>
            </div>

            {/* Subcategory Pill */}
            {file.subcategory && (
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/70 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                {file.subcategory}
              </span>
            )}
          </div>
        </div>

        {/* File Name */}
        <h3
          title={file.fileName}
          className="mt-4 truncate text-sm font-bold text-gray-900 dark:text-white"
        >
          {file.fileName}
        </h3>

        {/* AI Summary Snippet if present */}
        {file.summary && (
          <p className="mt-1.5 line-clamp-2 text-xs text-gray-600 dark:text-gray-300">
            {file.summary}
          </p>
        )}

        {/* Metadata stats */}
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1 font-medium">
            <HardDrive className="h-3.5 w-3.5" />
            {formatFileSize(file.fileSize)}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formattedDate}
          </span>
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {file.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-slate-800 dark:text-gray-300"
              >
                <Tag className="h-2.5 w-2.5 text-gray-400" />
                {tag}
              </span>
            ))}
            {file.tags.length > 3 && (
              <span className="text-[10px] text-gray-400">+{file.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Move Category Popover */}
      {isMoving && (
        <form
          onSubmit={handleMoveSubmit}
          className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 dark:border-indigo-900/50 dark:bg-slate-800/80"
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 dark:text-indigo-200">
            <span>Move to Category</span>
            <button
              type="button"
              onClick={() => setIsMoving(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2 space-y-1.5">
            <select
              id="select-move-category"
              value={selectedTargetCat}
              onChange={(e) => {
                setSelectedTargetCat(e.target.value);
                setSelectedTargetSubcat('');
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
            >
              {categoryTree.map((node) => (
                <option key={node._id} value={node.name}>
                  {node.name}
                </option>
              ))}
            </select>

            {availableSubcategories.length > 0 && (
              <select
                id="select-move-subcategory"
                value={selectedTargetSubcat}
                onChange={(e) => setSelectedTargetSubcat(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
              >
                <option value="">No subcategory</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub._id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            )}

            <button
              id="btn-confirm-move"
              type="submit"
              className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
            >
              <Check className="h-3 w-3" />
              <span>Confirm Move</span>
            </button>
          </div>
        </form>
      )}

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-slate-800/80">
        <div className="flex items-center gap-1">
          {/* Open / View */}
          <a
            href={file.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <ExternalLink className="h-4 w-4" />
          </a>

          {/* Download */}
          <a
            href={file.cloudinaryUrl}
            download={file.fileName}
            title="Download file"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <Download className="h-4 w-4" />
          </a>

          {/* Share Link Button */}
          <button
            id={`btn-share-file-${file._id}`}
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            title="Share file"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* Move Category Button */}
          {onMove && (
            <button
              id={`btn-move-file-${file._id}`}
              type="button"
              onClick={() => setIsMoving(!isMoving)}
              title="Move category"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            >
              <FolderInput className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Delete button or confirmation */}
        {showConfirm ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            title="Delete file"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        file={file}
      />
    </div>
  );
};

export default FileCard;
