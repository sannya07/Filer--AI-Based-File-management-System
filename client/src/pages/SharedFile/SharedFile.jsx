import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import shareService from '../../services/shareService';
import { formatFileSize } from '../../utils/hashUtil';
import {
  FileText,
  Clock,
  HardDrive,
  Download,
  ExternalLink,
  Shield,
  Eye,
  AlertTriangle,
  FolderOpen,
  Sparkles,
  Tag,
  Loader2,
  Lock
} from 'lucide-react';

const SharedFile = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null); // 'expired' | 'revoked' | 'not_found' | null
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchSharedDocument = async () => {
      try {
        setLoading(true);
        setErrorStatus(null);
        const res = await shareService.getSharedFile(token);

        if (res.success) {
          setFile(res.file);
          setShareLink(res.shareLink);
        }
      } catch (err) {
        console.error('Failed to load shared file:', err);
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 410 || data?.isExpired) {
          setErrorStatus('expired');
          setErrorMessage('Link Expired');
        } else if (status === 403 || data?.isRevoked) {
          setErrorStatus('revoked');
          setErrorMessage('This shared document link has been revoked by the owner.');
        } else {
          setErrorStatus('not_found');
          setErrorMessage(data?.message || 'Shared document not found.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedDocument();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Public Navbar */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-gray-900 dark:text-white">
                FILER<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <span className="ml-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Public Share
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto my-auto w-full max-w-2xl px-4 py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="mt-4 text-xs font-medium text-gray-500">
              Verifying security token & loading document...
            </p>
          </div>
        ) : errorStatus ? (
          /* Error / Expired / Revoked Card */
          <div
            id="share-error-card"
            className="rounded-3xl border border-red-200/80 bg-white p-8 text-center shadow-xl dark:border-red-950/40 dark:bg-slate-900"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
              {errorStatus === 'expired' ? (
                <Clock className="h-7 w-7" />
              ) : (
                <Lock className="h-7 w-7" />
              )}
            </div>
            <h1
              id="share-error-title"
              className="mt-5 text-xl font-bold text-gray-900 dark:text-white"
            >
              {errorStatus === 'expired' ? 'Link Expired' : 'Access Denied'}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {errorMessage || 'This shared document link is no longer valid or accessible.'}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500"
              >
                Go to FILER AI Workspace
              </Link>
            </div>
          </div>
        ) : file ? (
          /* Active Document Preview Card */
          <div
            id="public-shared-card"
            className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-md">
                    {file.category || 'Shared Document'}
                  </span>
                  {file.subcategory && (
                    <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-medium text-indigo-200">
                      {file.subcategory}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-indigo-200">
                  {shareLink?.viewOnly ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold">
                      <Eye className="h-3 w-3" />
                      View Only
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                      <Download className="h-3 w-3" />
                      Download Allowed
                    </span>
                  )}
                </div>
              </div>

              <h1
                id="shared-file-name"
                className="mt-4 text-xl font-bold tracking-tight sm:text-2xl text-white"
              >
                {file.fileName}
              </h1>

              <div className="mt-3 flex items-center gap-3 text-xs text-indigo-200">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  {formatFileSize(file.fileSize)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* AI Summary Banner */}
              {file.summary && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <h3 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        AI Generated Document Summary
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-indigo-950/90 dark:text-indigo-200/90">
                        {file.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {file.tags && file.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Document Tags
                  </h4>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {file.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-slate-800 dark:text-gray-300"
                      >
                        <Tag className="h-3 w-3 text-gray-400" />
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6 dark:border-slate-800">
                <a
                  href={file.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-public-open-preview"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open in Browser</span>
                </a>

                {!shareLink?.viewOnly ? (
                  <a
                    href={file.cloudinaryUrl}
                    download={file.fileName}
                    id="btn-public-download"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Original Document</span>
                  </a>
                ) : (
                  <div
                    id="view-only-indicator"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-gray-400"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Download disabled by owner</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400 dark:border-slate-800/80">
        <p>Protected by FILER AI Secure Document Delivery</p>
      </footer>
    </div>
  );
};

export default SharedFile;
