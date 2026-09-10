import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import FileCard from '../../components/FileCard/FileCard';
import UploadModal from '../../components/UploadModal/UploadModal';
import fileService from '../../services/fileService';
import { formatFileSize } from '../../utils/hashUtil';
import config from '../../config/app.config';
import {
  FileText,
  Sparkles,
  FolderTree,
  Upload,
  Search,
  HardDrive,
  Loader2,
  Filter,
  CheckCircle2,
  FolderOpen
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await fileService.getFiles(params);
      if (response.success) {
        setFiles(response.files || []);
        setTotalStorageBytes(response.totalStorageBytes || 0);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUploadSuccess = (newFile) => {
    setToastMessage(`"${newFile.fileName}" uploaded successfully!`);
    fetchFiles();
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleDeleteFile = async (id) => {
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      setToastMessage('File deleted successfully.');
      setTimeout(() => setToastMessage(''), 3000);
      fetchFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const categories = ['All', ...config.defaultCategories];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xl dark:border-emerald-900/50 dark:bg-emerald-950 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 sm:p-10 text-white shadow-xl shadow-indigo-900/10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-200 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
              <span>Personal Knowledge Workspace</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {user?.name || 'Explorer'}
            </h1>
            <p className="mt-2 text-sm text-indigo-100 sm:text-base">
              Store, organize, and retrieve your files securely with duplicate detection and fast cloud storage.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                id="btn-dashboard-upload-cta"
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-indigo-900 shadow-md transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Upload className="h-4 w-4 text-indigo-600" />
                <span>Upload New File</span>
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total Files
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p id="stat-total-files" className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {files.length}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Stored in your workspace</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Storage Used
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <p id="stat-storage-used" className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {formatFileSize(totalStorageBytes)}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Active cloud capacity</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                AI Ready
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {files.length}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Ready for Phase 3 AI review</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Categories
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <FolderTree className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {config.defaultCategories.length}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Default category tree</p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Categories Pill Nav */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-slate-900 dark:text-gray-300 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              id="dashboard-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* File Grid or Empty State */}
        <div className="mt-6">
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {files.map((file) => (
                <FileCard key={file._id} file={file} onDelete={handleDeleteFile} />
              ))}
            </div>
          ) : (
            <div
              id="empty-files-container"
              className="rounded-3xl border border-dashed border-gray-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FolderOpen className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                No files found
              </h2>
              <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No documents match the current filter or search criteria.'
                  : 'Start uploading notes, documents, resumes, and study material to your workspace.'}
              </p>
              <div className="mt-6">
                <button
                  id="btn-empty-upload-cta"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default Dashboard;
