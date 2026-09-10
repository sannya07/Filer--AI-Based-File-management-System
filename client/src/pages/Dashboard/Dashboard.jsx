import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar/Navbar';
import {
  FileText,
  Sparkles,
  FolderTree,
  Upload,
  Search,
  CheckCircle,
  HardDrive,
  Clock
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
              Your files are stored securely and analyzed using AI to help you find, understand, and interact with them in seconds.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                id="btn-dashboard-upload-cta"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-indigo-900 shadow-md transition hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <Upload className="h-4 w-4 text-indigo-600" />
                <span>Upload New File</span>
              </button>

              <button
                id="btn-dashboard-search-cta"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20 focus:outline-none"
              >
                <Search className="h-4 w-4" />
                <span>Search Documents</span>
              </button>
            </div>
          </div>

          {/* Background decorative element */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-20 h-64 w-64 rounded-full bg-purple-500/20 blur-3xl" />
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total Files
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="mt-1 text-[11px] text-gray-400">Ready to store & categorize</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Storage Used
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                <HardDrive className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">0.0 MB</p>
            <p className="mt-1 text-[11px] text-gray-400">On Cloudinary Storage</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                AI Summarized
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="mt-1 text-[11px] text-gray-400">Human approved metadata</p>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition hover:shadow dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Categories
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <FolderTree className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">7</p>
            <p className="mt-1 text-[11px] text-gray-400">Default category tree</p>
          </div>
        </div>

        {/* Empty Workspace State */}
        <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Upload className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
            Your workspace is ready
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-gray-500 dark:text-gray-400">
            Phase 1 Authentication is complete. In Phase 2, you will be able to upload, manage, and download files with duplicate detection.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle className="h-3.5 w-3.5" /> Phase 1: Authentication Live
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
