import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          to="/"
          id="navbar-brand-link"
          className="flex items-center gap-2.5 transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/25">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                FILER
              </span>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/60 dark:text-indigo-300">
                <Sparkles className="mr-0.5 h-3 w-3" /> AI
              </span>
            </div>
          </div>
        </Link>

        {/* Actions (Theme Toggle & Auth) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle id="btn-theme-toggle" />

          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div
                id="user-profile-badge"
                title={`${user.name} (${user.email})`}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 p-1 sm:py-1.5 sm:pl-2 sm:pr-4 transition dark:border-slate-700 dark:bg-slate-800/80"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="h-4 w-4" />}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="max-w-[100px] truncate text-xs font-semibold text-gray-800 dark:text-gray-200 lg:max-w-[140px]">
                    {user.name}
                  </p>
                  <p className="hidden md:block max-w-[130px] truncate text-[10px] text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <button
                id="btn-logout"
                onClick={handleLogout}
                title="Sign Out"
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-2 text-xs font-medium text-gray-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:px-3 sm:py-2"
              >
                <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                id="navbar-login-link"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 transition hover:text-indigo-600 dark:text-gray-300 dark:hover:text-white"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                id="navbar-signup-link"
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-500"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
