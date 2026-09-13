import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import {
  FolderKanban,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Bot,
  Layers,
  Share2,
  FileText,
  Search,
  CheckCircle2,
  Lock,
  Eye,
  TrendingUp,
  Cpu,
  Database,
  Cloud,
  ExternalLink,
  ChevronRight,
  Hash,
  Star,
  Activity,
  Award,
  Menu,
  X
} from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#090d16] dark:text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-indigo-600/20 via-purple-600/20 to-blue-600/10 blur-[130px] dark:from-indigo-600/25 dark:via-purple-600/20 dark:to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[700px] -left-40 -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px] dark:bg-purple-600/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[1400px] -right-40 -z-10 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[140px] dark:bg-indigo-600/20"
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP NAVBAR                                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/85 backdrop-blur-md transition-colors dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 transition hover:opacity-90 shrink-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25">
              <FolderKanban className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
                  FILER
                </span>
                <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] sm:text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/70 dark:text-indigo-300 dark:ring-indigo-500/20">
                  <Sparkles className="mr-0.5 h-2.5 w-2.5 sm:h-3 sm:w-3" /> AI
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="transition hover:text-indigo-600 dark:hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-indigo-600 dark:hover:text-white">
              How It Works
            </a>
            <a href="#preview" className="transition hover:text-indigo-600 dark:hover:text-white">
              Platform Demo
            </a>
            <a href="#architecture" className="transition hover:text-indigo-600 dark:hover:text-white">
              Architecture
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle id="btn-theme-toggle-landing" />

            {/* Desktop Auth Actions */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                id="btn-landing-dashboard"
                className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-purple-500 active:scale-95"
              >
                <span>Open Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
                <Link
                  to="/login"
                  id="btn-landing-login"
                  className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-100/80 dark:border-slate-800 dark:text-gray-200 dark:hover:bg-slate-850"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  id="btn-landing-signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 sm:px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 active:scale-95"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger Button */}
            <button
              type="button"
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden inline-flex items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-menu"
            className="lg:hidden border-t border-gray-200/80 bg-white/95 backdrop-blur-xl px-4 py-5 shadow-2xl transition-all dark:border-slate-800/80 dark:bg-slate-950/95"
          >
            <div className="flex flex-col space-y-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <span>Features</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <span>How It Works</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <span>Platform Demo</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>
              <a
                href="#architecture"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                <span>Architecture</span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </a>

              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                {isAuthenticated ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25"
                  >
                    <span>Open Workspace</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/25"
                    >
                      <span>Get Started Free</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex w-full items-center justify-center rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. HERO SECTION                                               */}
      {/* ------------------------------------------------------------- */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Release Pill Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-md dark:border-indigo-500/30 dark:bg-indigo-950/60 dark:text-indigo-300 mb-6 transition hover:scale-105">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Next-Generation Intelligent File Management System</span>
          <span className="hidden sm:inline-block text-indigo-400">•</span>
          <span className="hidden sm:inline-block font-mono text-[11px] text-indigo-600 dark:text-indigo-400">v2.4 Live</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.15] dark:text-white">
          Organize, Understand & Share Files with{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
            Deep Intelligence
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal">
          Tired of chaotic folders and duplicate documents? FILER AI combines{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-100">instant SHA-256 deduplication</strong>,{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-100">automated neural categorization</strong>,{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-100">strict grounded document Q&A</strong>, and{' '}
          <strong className="font-semibold text-slate-800 dark:text-slate-100">view-only public links</strong> with embedded in-page readers that never force unwanted file downloads.
        </p>

        {/* Hero CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/signup'}
            id="btn-hero-primary"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95"
          >
            <span>{isAuthenticated ? 'Go to Your Workspace' : 'Get Started Free'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#preview"
            id="btn-hero-demo"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-slate-100/90 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>Explore Live Workspace</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </a>
        </div>

        {/* Feature stats counter pills */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-3xl mx-auto pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="p-3">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Zero Hallucination Q&A</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">&lt; 50ms</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">SHA-256 Deduplication</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Max-Heap</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Algorithmic Priority Shelf</p>
          </div>
          <div className="p-3">
            <p className="text-2xl font-black text-amber-500 dark:text-amber-400">View-Only</p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">No Forced Downloads</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. INTERACTIVE PLATFORM PREVIEW MOCKUP                         */}
      {/* ------------------------------------------------------------- */}
      <section id="preview" className="px-4 py-8 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-2xl backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70 sm:p-5">
          {/* Top Window chrome */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5 px-2 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500/80"></span>
              <span className="h-3 w-3 rounded-full bg-green-500/80"></span>
              <span className="ml-3 text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                https://filerai-blush.vercel.app/dashboard
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px]">
                <Activity className="h-3 w-3" /> Live Production Engine
              </span>
            </div>
          </div>

          {/* Interactive Simulated Dashboard */}
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-5 p-2 sm:p-4">
            {/* Left Column: Priority Shelf & Categories */}
            <div className="lg:col-span-5 space-y-4">
              {/* Priority Shelf preview */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Priority Shelf</span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">
                    Max-Heap Ranked
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                    <div className="flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          OS_Scheduling_Notes.txt
                        </p>
                        <p className="text-[10px] text-slate-500">Study Material • 99% Conf</p>
                      </div>
                    </div>
                    <span className="rounded bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      Pinned
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/40">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          Quarterly_Architecture_v2.docx
                        </p>
                        <p className="text-[10px] text-slate-500">Projects • 94% Conf</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      Score: 820
                    </span>
                  </div>
                </div>
              </div>

              {/* Categories tree preview */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/70 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Smart Category Tree</span>
                  <span className="text-[10px] text-slate-400">N-ary Hierarchy</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Study Material</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">14 files</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Projects</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">8 files</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Certificates</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">5 files</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Resumes</span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">3 files</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Grounded AI Q&A & Document Viewer */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950/80 shadow-sm flex flex-col justify-between">
              <div>
                {/* Tabs */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === 'summary'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      AI Summary & Tags
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                        activeTab === 'chat'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      Grounded Q&A
                    </button>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
                    <Eye className="h-3 w-3" /> View Only Protection
                  </span>
                </div>

                {activeTab === 'summary' ? (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                      <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        AI Neural Synthesis (99% Confidence)
                      </p>
                      <p className="mt-1.5 text-xs text-indigo-950/90 dark:text-indigo-200/90 leading-relaxed">
                        "Document presents lecture notes on CPU scheduling algorithms including FCFS (FIFO, non-preemptive), SJF (minimizing average waiting time), and Round Robin time-sharing."
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Generated Tags
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['operating-systems', 'cpu-scheduling', 'round-robin', 'sjf', 'fifo'].map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-3 text-right">
                      <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                        "Which algorithm minimizes average waiting time?"
                      </p>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 dark:border-indigo-950/60 dark:bg-indigo-950/20 p-3 text-left">
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                        Based on Section 2 of <strong>OS_Scheduling_Notes.txt</strong>, <em>Shortest Job First (SJF)</em> is provably optimal for minimizing average waiting time.
                      </p>
                      <span className="inline-block mt-2 rounded bg-indigo-600/10 px-2 py-0.5 text-[10px] font-mono text-indigo-700 dark:text-indigo-300">
                        [Citation: OS_Scheduling_Notes.txt - Line 5]
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom bar inside preview */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-emerald-500" /> SHA-256 Hash Verified
                </span>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                  Cloudinary & MongoDB Synced
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. BENTO GRID FEATURES SECTION                                */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Intelligent Core Features
          </h2>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Everything you need for zero-chaos file management.
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Built from first principles to solve real document frustration: duplicate clutter, forgotten file names, lost context, and broken download links.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Deduplication */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 mb-5">
              <Hash className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Instant SHA-256 Deduplication
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Never re-upload the same file twice. Client-side and server-side hashing identifies byte-level duplicates in under 50ms, preserving your cloud storage quota and eliminating redundancy.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <span>Zero redundant bytes</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2: AI Auto-Categorization */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/70 dark:text-purple-400 mb-5">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Categorization & Synthesis
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Files are automatically analyzed using an intelligent multi-model fallback chain. Receives instant summaries, descriptive tags, and high-confidence categorization across customizable category trees.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              <span>Gemma 4 Multi-Model Chain</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3: Grounded Q&A */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 mb-5">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Strict Grounded Q&A (Lazy RAG)
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Ask detailed questions about your documents and receive grounded answers backed by verifiable sentence citations. Out-of-scope questions are strictly refused to prevent hallucinations.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Zero-hallucination guarantee</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4: Max-Heap Priority Shelf */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 mb-5">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Priority Shelf (Max-Heap DSA)
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              No more scrolling through hundreds of documents. An algorithmic priority queue dynamically ranks your most important files using access frequency, recency, and manual priority boosts.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span>O(log n) algorithmic sorting</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 5: View-Only Share & In-Page Reader */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400 mb-5">
              <Eye className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              View-Only Document Sharing
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Share files securely with customizable expiration dates. Our standalone web reader renders DOCX, PDF, images, and text inline in the browser, preventing unauthorized local downloads.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Inline Reader • No forced downloads</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 6: Fast Trie Autocomplete */}
          <div className="rounded-3xl border border-slate-200/90 bg-white/80 p-7 shadow-lg backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/80 transition hover:shadow-xl hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 dark:bg-pink-950/70 dark:text-pink-400 mb-5">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Prefix Trie Search & Filtering
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Locate any document in milliseconds. A client-side Trie data structure indexes document names, categories, and tags for instant keystroke autocomplete and subcategory filtering.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400">
              <span>O(k) instant prefix search</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. HOW IT WORKS (3-STEP PROCESS)                              */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Frictionless Workflow
          </h2>
          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            How FILER AI Works
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm mb-4">
              01
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Any Document
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Drag and drop DOCX, PDF, TXT, CSV, or images. Instant SHA-256 hashing verifies uniqueness before cloud storage streaming.
            </p>
          </div>

          <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-sm mb-4">
              02
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Neural Indexing & Categorization
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Our neural engine extracts content, assigns accurate category tags, generates executive summaries, and ranks priority scores.
            </p>
          </div>

          <div className="relative rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-600 text-white font-black text-sm mb-4">
              03
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Chat & Share Securely
            </h4>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Ask questions with grounded citations or generate expiring view-only share links that recipients can read inline without downloading.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. ARCHITECTURE & TECH STACK                                  */}
      {/* ------------------------------------------------------------- */}
      <section id="architecture" className="px-4 py-16 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
            Enterprise Architecture
          </h2>
          <p className="mt-1.5 text-2xl font-black text-slate-900 dark:text-white">
            Engineered for Resilience & Speed
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto">
          {[
            { label: 'React 19 + Vite', icon: Layers },
            { label: 'Tailwind CSS', icon: Sparkles },
            { label: 'Node.js + Express', icon: Cpu },
            { label: 'MongoDB Atlas', icon: Database },
            { label: 'Cloudinary Cloud Storage', icon: Cloud },
            { label: 'OpenRouter Gemma 4', icon: Bot },
            { label: 'Vercel Serverless', icon: Zap }
          ].map((tech) => (
            <span
              key={tech.label}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200"
            >
              <tech.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {tech.label}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. BOTTOM CTA BANNER                                          */}
      {/* ------------------------------------------------------------- */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-8 sm:p-14 text-center text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-3xl font-extrabold sm:text-4xl tracking-tight">
              Ready to Upgrade Your File Workflow?
            </h3>
            <p className="mt-4 text-sm sm:text-base text-indigo-100 leading-relaxed">
              Join FILER AI today and experience zero duplicate files, effortless neural search, and grounded document intelligence.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={isAuthenticated ? '/dashboard' : '/signup'}
                id="btn-footer-cta"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-indigo-900 shadow-lg transition hover:bg-indigo-50 hover:scale-105 active:scale-95"
              >
                <span>{isAuthenticated ? 'Open Your Workspace' : 'Create Free Account'}</span>
                <ArrowRight className="h-4 w-4 text-indigo-700" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. FOOTER                                                     */}
      {/* ------------------------------------------------------------- */}
      <footer className="border-t border-slate-200/80 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
              F
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              FILER AI Systems
            </span>
            <span>• Intelligent File Management</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-indigo-600 dark:hover:text-white transition">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-indigo-600 dark:hover:text-white transition">
              Sign Up
            </Link>
            <a
              href="https://github.com/sannya07/Filer--AI-Based-File-management-System"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 dark:hover:text-white transition inline-flex items-center gap-1"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <p className="text-center mt-6 text-[11px] text-slate-400">
          © {new Date().getFullYear()} FILER AI. All rights reserved. Powered by Gemma 4 & Cloudinary.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
