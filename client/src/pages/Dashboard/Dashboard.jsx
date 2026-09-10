import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import FileCard from '../../components/FileCard/FileCard';
import CategoryTree from '../../components/CategoryTree/CategoryTree';
import UploadModal from '../../components/UploadModal/UploadModal';
import fileService from '../../services/fileService';
import categoryService from '../../services/categoryService';
import { formatFileSize } from '../../utils/hashUtil';
import {
  FileText,
  Sparkles,
  FolderTree,
  Upload,
  Search,
  HardDrive,
  Loader2,
  CheckCircle2,
  FolderOpen,
  ChevronRight,
  Home,
  Tag
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const [files, setFiles] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingTree, setLoadingTree] = useState(true);

  // Hierarchy Selection State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [totalFilesCount, setTotalFilesCount] = useState(0);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Fetch Categories Tree
  const fetchCategoryTree = useCallback(async () => {
    try {
      setLoadingTree(true);
      const res = await categoryService.getCategories();
      if (res.success) {
        setCategoryTree(res.tree || []);
      }
    } catch (error) {
      console.error('Failed to load category tree:', error);
    } finally {
      setLoadingTree(false);
    }
  }, []);

  // 2. Fetch Files
  const fetchFiles = useCallback(async () => {
    try {
      setLoadingFiles(true);
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (selectedSubcategory) {
        params.subcategory = selectedSubcategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await fileService.getFiles(params);
      if (response.success) {
        setFiles(response.files || []);
        setTotalFilesCount(response.totalFiles || 0);
        setTotalStorageBytes(response.totalStorageBytes || 0);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedCategory, selectedSubcategory, searchQuery]);

  useEffect(() => {
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Notifications helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Upload callback
  const handleUploadSuccess = (newFile) => {
    showToast(`"${newFile.fileName}" uploaded successfully!`);
    fetchFiles();
    fetchCategoryTree();
  };

  // Delete File callback
  const handleDeleteFile = async (id) => {
    try {
      await fileService.deleteFile(id);
      setFiles((prev) => prev.filter((f) => f._id !== id));
      showToast('File deleted successfully.');
      fetchFiles();
      fetchCategoryTree();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  // Category Tree Actions
  const handleCreateCategory = async (data) => {
    const res = await categoryService.createCategory(data);
    if (res.success) {
      showToast(`Category "${res.category.name}" created.`);
      await fetchCategoryTree();
    }
  };

  const handleUpdateCategory = async (id, name) => {
    const res = await categoryService.updateCategory(id, { name });
    if (res.success) {
      showToast(`Category renamed to "${res.category.name}".`);
      await fetchCategoryTree();
      await fetchFiles();
    }
  };

  const handleDeleteCategory = async (id) => {
    const res = await categoryService.deleteCategory(id);
    if (res.success) {
      showToast(res.message || 'Category deleted.');
      if (selectedCategory !== 'All') {
        setSelectedCategory('All');
        setSelectedSubcategory('');
      }
      await fetchCategoryTree();
      await fetchFiles();
    }
  };

  // Move File between categories
  const handleMoveFile = async (fileId, category, subcategory) => {
    const res = await categoryService.moveFile({ fileId, category, subcategory });
    if (res.success) {
      showToast(res.message || 'File moved successfully.');
      await fetchFiles();
      await fetchCategoryTree();
    }
  };

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
              {totalFilesCount}
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
              {totalFilesCount}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">With AI intelligence layer</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Root Categories
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <FolderTree className="h-4 w-4" />
              </div>
            </div>
            <p id="stat-category-count" className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
              {categoryTree.length}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">Hierarchy tree DSA</p>
          </div>
        </div>

        {/* 2-Column Layout: Tree Sidebar (Left) + Files & Breadcrumbs (Right) */}
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Column 1: Category Tree Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <CategoryTree
                tree={categoryTree}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                onSelectSubcategory={(sub) => setSelectedSubcategory(sub)}
                onCreateCategory={handleCreateCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                totalFiles={totalFilesCount}
              />
            </div>
          </div>

          {/* Column 2: Search, Breadcrumbs & File Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Toolbar: Breadcrumbs & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {/* Breadcrumbs */}
              <div id="breadcrumbs-nav" className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSelectedSubcategory('');
                  }}
                  className="flex items-center gap-1 font-medium hover:text-indigo-600 transition"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Workspace</span>
                </button>

                {selectedCategory !== 'All' && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <button
                      onClick={() => setSelectedSubcategory('')}
                      className={`font-semibold transition ${
                        !selectedSubcategory ? 'text-indigo-600 dark:text-indigo-400' : 'hover:text-indigo-600'
                      }`}
                    >
                      {selectedCategory}
                    </button>
                  </>
                )}

                {selectedSubcategory && (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {selectedSubcategory}
                    </span>
                  </>
                )}

                {(selectedCategory !== 'All' || selectedSubcategory) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedSubcategory('');
                    }}
                    className="ml-2 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="dashboard-search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in category..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
                />
              </div>
            </div>

            {/* Active Category Header Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  {selectedSubcategory
                    ? `${selectedCategory} / ${selectedSubcategory}`
                    : selectedCategory === 'All'
                    ? 'All Documents'
                    : selectedCategory}
                </h2>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </span>
              </div>
            </div>

            {/* File Grid or Empty State */}
            {loadingFiles ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : files.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {files.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onDelete={handleDeleteFile}
                    onMove={handleMoveFile}
                    categoryTree={categoryTree}
                  />
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
                  No files in this category
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedCategory !== 'All'
                    ? `No files found under "${selectedSubcategory || selectedCategory}". Upload a file or move files here.`
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
