import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import shareService from '../../services/shareService';
import {
  Share2,
  X,
  Copy,
  Check,
  Clock,
  Shield,
  Eye,
  Download,
  AlertCircle,
  Loader2,
  Trash2,
  ExternalLink
} from 'lucide-react';

const ShareModal = ({ isOpen, onClose, file }) => {
  const [expiryDays, setExpiryDays] = useState('7');
  const [viewOnly, setViewOnly] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeLink, setActiveLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [existingLinks, setExistingLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);

  // Fetch existing share links when modal opens
  useEffect(() => {
    if (isOpen && file?._id) {
      setError('');
      setCopied(false);
      fetchExistingLinks();
    }
  }, [isOpen, file]);

  const fetchExistingLinks = async () => {
    try {
      setLoadingLinks(true);
      const res = await shareService.getFileShareLinks(file._id);
      if (res.success && res.links && res.links.length > 0) {
        setExistingLinks(res.links);
        setActiveLink(res.links[0]);
      } else {
        setExistingLinks([]);
        setActiveLink(null);
      }
    } catch (err) {
      console.error('Failed to load existing links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  if (!isOpen || !file) return null;

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      setIsGenerating(true);
      setError('');
      const res = await shareService.createShareLink({
        fileId: file._id,
        expiryDays: expiryDays === '0' ? null : Number(expiryDays),
        viewOnly
      });

      if (res.success && res.shareLink) {
        setActiveLink(res.shareLink);
        setExistingLinks((prev) => [res.shareLink, ...prev]);
      }
    } catch (err) {
      console.error('Failed to generate link:', err);
      setError(err.response?.data?.message || 'Failed to generate link.');
    } finally {
      setIsGenerating(false);
    }
  };

  const fullShareUrl = activeLink
    ? `${window.location.origin}/share/${activeLink.token}`
    : '';

  const handleCopy = () => {
    if (!fullShareUrl) return;
    navigator.clipboard.writeText(fullShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevoke = async (token) => {
    try {
      await shareService.revokeShareLink(token);
      setActiveLink(null);
      setExistingLinks((prev) => prev.filter((l) => l.token !== token));
    } catch (err) {
      console.error('Failed to revoke link:', err);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        id="share-modal-container"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Share Document
              </h2>
              <p className="text-xs text-gray-500">
                Generate secure public links with custom access permissions
              </p>
            </div>
          </div>

          <button
            id="btn-close-share-modal"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* File Snapshot */}
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/50">
            <div className="truncate pr-3">
              <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                {file.fileName}
              </p>
              <p className="text-[11px] text-gray-500">{file.category || 'Others'}</p>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {file.fileType || 'Document'}
            </span>
          </div>

          {/* Active Generated Link Display */}
          {activeLink ? (
            <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" />
                  Active Share Link
                </span>
                <span className="text-[10px] font-semibold text-gray-500">
                  {activeLink.expiresAt
                    ? `Expires: ${new Date(activeLink.expiresAt).toLocaleDateString()}`
                    : 'Never expires'}
                </span>
              </div>

              {/* URL Input & Copy Button */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="input-share-url"
                  readOnly
                  value={fullShareUrl}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200"
                />
                <button
                  type="button"
                  id="btn-copy-share-link"
                  onClick={handleCopy}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-semibold shadow-sm transition ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Link Details & Revoke */}
              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1">
                    {activeLink.viewOnly ? (
                      <>
                        <Eye className="h-3 w-3 text-indigo-500" />
                        <span>View Only</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3 w-3 text-emerald-500" />
                        <span>Download Allowed</span>
                      </>
                    )}
                  </span>
                  <span>•</span>
                  <span>{activeLink.accessCount || 0} views</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={fullShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    <span>Preview</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>

                  <button
                    type="button"
                    id="btn-revoke-share-link"
                    onClick={() => handleRevoke(activeLink.token)}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Revoke</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Configure New Link Form */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Expiration Options */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  Link Expiration
                </label>
                <select
                  id="select-share-expiry"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(e.target.value)}
                  className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="1">24 Hours (1 Day)</option>
                  <option value="7">7 Days (1 Week)</option>
                  <option value="30">30 Days (1 Month)</option>
                  <option value="0">Never (Permanent until revoked)</option>
                </select>
              </div>

              {/* Permission Toggle */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Shield className="h-3.5 w-3.5 text-indigo-500" />
                  Access Permission
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    id="btn-perm-viewonly"
                    onClick={() => setViewOnly(true)}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      viewOnly
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Only</span>
                  </button>

                  <button
                    type="button"
                    id="btn-perm-download"
                    onClick={() => setViewOnly(false)}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition ${
                      !viewOnly
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-400 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Allow Download</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-generate-share-link"
                  disabled={isGenerating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Secure Link...</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      <span>Generate Share Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer close */}
          <div className="flex justify-end border-t border-gray-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareModal;
