import React, { useState } from 'react';
import config from '../../config/app.config';
import { formatFileSize } from '../../utils/hashUtil';
import {
  Sparkles,
  CheckCircle2,
  X,
  FileText,
  Tag,
  Plus,
  HelpCircle,
  FolderTree,
  Lightbulb,
  ArrowRight,
  Trash2
} from 'lucide-react';

const cleanUnicode = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/[\u202F\u00A0\u2000-\u200B\uFEFF]/g, ' ')
    .replace(/â€¯/g, ' ')
    .replace(/â€“|â€”/g, '-')
    .trim();
};

const AIReviewCard = ({ file, aiData, onAccept, onReject, isUploading }) => {
  const [summary, setSummary] = useState(cleanUnicode(aiData.summary) || '');
  const [description, setDescription] = useState(cleanUnicode(aiData.description) || '');
  const [category, setCategory] = useState(aiData.category || 'Others');
  const [tags, setTags] = useState(aiData.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = cleanUnicode(newTagInput).trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAccept = () => {
    onAccept({
      summary: cleanUnicode(summary),
      description: cleanUnicode(description),
      category,
      tags,
      confidence: aiData.confidence,
      reasoning: cleanUnicode(aiData.reasoning)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        id="ai-review-modal-container"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Human-in-the-Loop AI Review
                </h2>
                <span
                  id="ai-confidence-badge"
                  className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                >
                  {aiData.confidence || '90%'} Match
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Review and modify AI suggestions before permanent storage
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-review"
            onClick={onReject}
            disabled={isUploading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* File Snapshot Banner */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {cleanUnicode(file.name)}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
              In-Memory Buffer
            </span>
          </div>

          {/* Explainable AI Reasoning Banner */}
          {aiData.reasoning && (
            <div
              id="ai-reasoning-banner"
              className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30"
            >
              <div className="flex items-start gap-2.5">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Why this category? (Explainable AI)
                  </h4>
                  <p className="mt-0.5 text-xs text-indigo-800/90 dark:text-indigo-300/90">
                    {cleanUnicode(aiData.reasoning)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Editable Category */}
          <div>
            <label
              htmlFor="review-category-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              <FolderTree className="h-3.5 w-3.5 text-indigo-500" />
              Document Category (AI Recommended)
            </label>
            <select
              id="review-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            >
              {config.defaultCategories.map((cat) => (
                <option key={cat} value={cat} className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">
                  {cat} {cat === aiData.category ? '(AI Pick)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Editable Summary */}
          <div>
            <label
              htmlFor="review-summary-input"
              className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                AI Generated Summary
              </span>
              <span className="text-[10px] text-gray-400 font-normal">Click to edit</span>
            </label>
            <textarea
              id="review-summary-input"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white p-3 text-xs leading-relaxed text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Editable Description */}
          <div>
            <label
              htmlFor="review-description-input"
              className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300"
            >
              <span>Short Description</span>
              <span className="text-[10px] text-gray-400 font-normal">Click to edit</span>
            </label>
            <input
              type="text"
              id="review-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
            />
          </div>

          {/* Editable Tags */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
              <Tag className="h-3.5 w-3.5 text-indigo-500" />
              Generated Tags ({tags.length})
            </label>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 transition dark:bg-indigo-950/60 dark:text-indigo-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-0.5 rounded-full p-0.5 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 dark:hover:bg-indigo-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {/* Add Custom Tag Input */}
              <form onSubmit={handleAddTag} className="inline-flex items-center">
                <input
                  type="text"
                  id="add-tag-input"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="+ Add tag"
                  className="h-7 w-24 rounded-lg border border-dashed border-gray-300 bg-transparent px-2 text-xs text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:text-gray-300"
                />
              </form>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-slate-800">
            <button
              id="btn-reject-ai-review"
              type="button"
              onClick={onReject}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
              <span>Discard & Cancel</span>
            </button>

            <button
              id="btn-accept-ai-review"
              type="button"
              onClick={handleAccept}
              disabled={isUploading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Uploading to Cloud...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Accept & Save to Cloud</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIReviewCard;
