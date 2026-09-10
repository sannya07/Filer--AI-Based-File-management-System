import React, { useState, useRef } from 'react';
import { computeFileHash, formatFileSize } from '../../utils/hashUtil';
import fileService from '../../services/fileService';
import config from '../../config/app.config';
import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderTree
} from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [hash, setHash] = useState('');
  const [category, setCategory] = useState('Others');
  const [isHashing, setIsHashing] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setHash('');
    setCategory('Others');
    setIsHashing(false);
    setDuplicateData(null);
    setUploadProgress(0);
    setIsUploading(false);
    setError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    setError('');
    setDuplicateData(null);

    // Validate size (50MB)
    if (selectedFile.size > config.maxUploadSizeBytes) {
      setError(`File size exceeds 50MB limit (${formatFileSize(selectedFile.size)})`);
      return;
    }

    setFile(selectedFile);

    try {
      // Step 1: Compute SHA-256 in browser memory
      setIsHashing(true);
      const computedHash = await computeFileHash(selectedFile);
      setHash(computedHash);

      // Step 2: Check with server for duplicate
      const dupCheck = await fileService.checkDuplicate(computedHash);
      if (dupCheck.isDuplicate) {
        setDuplicateData(dupCheck.existingFile);
      }
    } catch (err) {
      console.error('Hash/Duplicate check error:', err);
      setError('Failed to analyze file integrity. You can still try uploading.');
    } finally {
      setIsHashing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('hash', hash);

      const response = await fileService.uploadFile(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percent);
        }
      });

      if (response.success && response.file) {
        onUploadSuccess(response.file);
        handleClose();
      }
    } catch (err) {
      console.error('Upload Error:', err);
      const message =
        err.response?.data?.message || 'Failed to upload file. Please try again.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div
        id="upload-modal-container"
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Upload Document
              </h2>
              <p className="text-xs text-gray-500">
                Secure cloud storage with duplicate detection
              </p>
            </div>
          </div>

          <button
            id="btn-close-upload-modal"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Duplicate Detection Warning Modal / Banner */}
          {duplicateData && (
            <div
              id="duplicate-warning-banner"
              className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/40"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    Possible Duplicate Detected
                  </h4>
                  <p className="mt-1 text-amber-800 dark:text-amber-300">
                    An identical file named{' '}
                    <strong className="font-semibold">{duplicateData.fileName}</strong> was
                    already uploaded on{' '}
                    {new Date(duplicateData.uploadedAt).toLocaleDateString()}.
                  </p>
                  <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-400">
                    SHA-256 match found in your library.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Drag and Drop Zone */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/60 p-8 text-center transition hover:border-indigo-500 hover:bg-indigo-50/20 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-indigo-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload-input"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md shadow-slate-200/50 dark:bg-slate-800">
                <UploadCloud className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200">
                Click to browse or drag and drop file here
              </p>
              <p className="mt-1 text-xs text-gray-500">
                PDF, DOCX, TXT, PPTX, CSV, ZIP, Images (Max 50MB)
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="max-w-xs truncate">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    onClick={() => {
                      setFile(null);
                      setDuplicateData(null);
                    }}
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Hashing Status */}
              {isHashing && (
                <div className="mt-3 flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Calculating SHA-256 hash in browser memory...</span>
                </div>
              )}
            </div>
          )}

          {/* Category Selection */}
          {file && (
            <div className="mt-5">
              <label
                htmlFor="upload-category-select"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300"
              >
                <FolderTree className="h-3.5 w-3.5 text-indigo-500" />
                Select Category
              </label>
              <select
                id="upload-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {config.defaultCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mt-5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Uploading to Cloud Storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-slate-800">
            <button
              id="btn-cancel-upload"
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            {duplicateData ? (
              <button
                id="btn-upload-anyway"
                type="button"
                onClick={handleUpload}
                disabled={isUploading || isHashing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-amber-600/25 transition hover:bg-amber-500 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload Anyway</span>
                )}
              </button>
            ) : (
              <button
                id="btn-confirm-upload"
                type="button"
                onClick={handleUpload}
                disabled={!file || isUploading || isHashing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Upload to Cloud</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
