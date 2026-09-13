import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import shareService from '../../services/shareService';
import { formatFileSize } from '../../utils/hashUtil';
import { triggerDownload } from '../../utils/downloadUtil';
import config from '../../config/app.config';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
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
  Lock,
  Maximize2,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen
} from 'lucide-react';

const SharedFile = () => {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [file, setFile] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [contentData, setContentData] = useState(null);
  const [viewMode, setViewMode] = useState('rich'); // 'rich' | 'raw'
  const [errorStatus, setErrorStatus] = useState(null); // 'expired' | 'revoked' | 'not_found' | null
  const [errorMessage, setErrorMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!file?.cloudinaryUrl || isDownloading || shareLink?.viewOnly) return;
    try {
      setIsDownloading(true);
      const targetUrl = `${config.apiUrl}/share/${token}/download`;
      await triggerDownload(targetUrl, file.fileName);
    } finally {
      setIsDownloading(false);
    }
  };

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

    const fetchContent = async () => {
      try {
        setLoadingContent(true);
        const contentRes = await shareService.getSharedFileContent(token);
        if (contentRes.success) {
          setContentData(contentRes);
        }
      } catch (err) {
        console.warn('Could not fetch rich document content:', err.message);
      } finally {
        setLoadingContent(false);
      }
    };

    if (token) {
      fetchSharedDocument();
      fetchContent();
    }
  }, [token]);

  const previewUrl = `${config.apiUrl}/share/${token}/preview`;
  const fileExt = file?.fileName?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 flex flex-col justify-between">
      {/* Public Navbar */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 sticky top-0 z-40">
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
            <ThemeToggle id="btn-theme-toggle-share" />
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
      <main className="mx-auto my-auto w-full max-w-4xl px-4 py-8 sm:py-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">
              Verifying security token & loading document...
            </p>
          </div>
        ) : errorStatus ? (
          /* Error / Expired / Revoked Card */
          <div
            id="share-error-card"
            className="rounded-3xl border border-red-200/80 bg-white p-8 text-center shadow-xl dark:border-red-950/40 dark:bg-slate-900 max-w-md mx-auto"
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
            <div className="bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 p-6 sm:p-8 text-white border-b border-indigo-800/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 px-3 py-1 text-[11px] font-semibold text-amber-200 backdrop-blur-md">
                      <Shield className="h-3.5 w-3.5 text-amber-300" />
                      View Only Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-md">
                      <Download className="h-3.5 w-3.5 text-emerald-300" />
                      Download Allowed
                    </span>
                  )}
                </div>
              </div>

              <h1
                id="shared-file-name"
                className="mt-4 text-xl font-bold tracking-tight sm:text-2xl text-white word-break-break-word"
              >
                {file.fileName}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-indigo-200/90">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  {formatFileSize(file.fileSize)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="rounded bg-indigo-800/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  {fileExt}
                </span>
              </div>
            </div>

            {/* Document Body */}
            <div className="space-y-6 p-6 sm:p-8">
              {/* AI Summary Banner */}
              {file.summary && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                        AI Generated Document Summary
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-indigo-900/90 dark:text-indigo-200/90">
                        {file.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* In-Page Document Viewer */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden dark:border-slate-800 dark:bg-slate-950/50">
                {/* Viewer Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 bg-white/70 dark:border-slate-800 dark:bg-slate-900/70 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Document Content Viewer
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      (No download required)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {contentData?.contentHtml && (
                      <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px] font-semibold dark:border-slate-700 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => setViewMode('rich')}
                          className={`rounded-md px-2.5 py-0.5 transition ${
                            viewMode === 'rich'
                              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          Formatted
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('raw')}
                          className={`rounded-md px-2.5 py-0.5 transition ${
                            viewMode === 'raw'
                              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                          }`}
                        >
                          Raw Text
                        </button>
                      </div>
                    )}

                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full standalone reader in a new tab"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Maximize2 className="h-3 w-3" />
                      <span>Full Window</span>
                    </a>
                  </div>
                </div>

                {/* Viewer Body */}
                <div className="p-4 sm:p-6">
                  {loadingContent ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                        Loading document view...
                      </p>
                    </div>
                  ) : contentData?.previewType === 'image' ? (
                    /* Image Viewer */
                    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-900/5 p-4 dark:bg-slate-900/50">
                      <img
                        src={previewUrl}
                        alt={file.fileName}
                        className="max-h-[500px] w-auto rounded-xl object-contain shadow-md"
                        loading="lazy"
                      />
                    </div>
                  ) : contentData?.previewType === 'pdf' ? (
                    /* PDF Embedded Viewer */
                    <div className="space-y-3">
                      <iframe
                        src={`${previewUrl}#toolbar=0`}
                        title={file.fileName}
                        className="w-full h-[520px] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm"
                      />
                      {contentData.contentText && (
                        <details className="text-xs text-slate-600 dark:text-slate-400">
                          <summary className="cursor-pointer font-semibold hover:text-indigo-600 dark:hover:text-indigo-400">
                            View extracted document text
                          </summary>
                          <pre className="mt-2 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-100 p-4 font-mono text-xs dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                            {contentData.contentText}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : contentData?.previewType === 'docx' ? (
                    /* DOCX Rich HTML Reader */
                    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 max-h-[520px] overflow-y-auto shadow-inner">
                      {viewMode === 'rich' && contentData.contentHtml ? (
                        <div
                          className="prose prose-sm sm:prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-sans"
                          dangerouslySetInnerHTML={{ __html: contentData.contentHtml }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-800 dark:text-slate-200">
                          {contentData.contentText || file.summary || 'No text extracted.'}
                        </pre>
                      )}
                    </div>
                  ) : contentData?.contentText ? (
                    /* Text / Code / CSV Viewer */
                    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed shadow-inner">
                      <pre className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                        {contentData.contentText}
                      </pre>
                    </div>
                  ) : (
                    /* Fallback metadata view */
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                      <FileText className="mx-auto h-10 w-10 text-slate-400 dark:text-slate-500" />
                      <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                        Document Ready
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                        This file is securely indexed. You can view the AI summary above or open the standalone reader tab.
                      </p>
                    </div>
                  )}
                </div>
              </div>

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

              {/* Action Buttons & Permission Notice */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6 dark:border-slate-800">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-public-open-preview"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Standalone Reader</span>
                </a>

                {!shareLink?.viewOnly ? (
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    id="btn-public-download"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>{isDownloading ? 'Downloading...' : 'Download Original Document'}</span>
                  </button>
                ) : (
                  <div
                    id="view-only-indicator"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/80 px-4 py-2.5 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:border-amber-900/50 dark:text-amber-300"
                  >
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span>View-Only Protected • Direct download restricted by owner</span>
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

