import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FolderKanban, Sparkles, User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Validation functions
  const isNameValid = (val) => {
    const trimmed = val.trim();
    if (trimmed.length < 2 || trimmed.length > 50) return false;
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return false;
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 2) return false;
    const lower = trimmed.toLowerCase();
    const reserved = ['__t', '__v', 'admin', 'root', 'system', 'null', 'undefined'];
    if (reserved.includes(lower) || lower.startsWith('__')) return false;
    return true;
  };

  const isEmailValid = (val) => {
    const trimmed = val.trim();
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed);
  };

  const passwordChecks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    noSpaces: !/\s/.test(password) && password.length > 0
  };

  const isPasswordValid =
    passwordChecks.length &&
    passwordChecks.hasUpper &&
    passwordChecks.hasLower &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial &&
    passwordChecks.noSpaces;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!isNameValid(trimmedName)) {
      setError('Please enter a valid full name (at least 2 letters, letters and spaces only, no tokens like __t).');
      return;
    }

    if (!isEmailValid(trimmedEmail)) {
      setError('Please provide a valid email address (e.g. name@example.com).');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must meet all security requirements listed below.');
      return;
    }

    try {
      setLoading(true);
      await register({ name: trimmedName, email: trimmedEmail, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Signup Error:', err);
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 sm:p-6 lg:p-8 transition-colors duration-300 dark:bg-[#080c15]">
      {/* Ambient Lighting Orbs for Dark Mode Depth */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[100px] dark:bg-indigo-600/20" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[450px] w-[450px] rounded-full bg-purple-500/10 blur-[100px] dark:bg-purple-600/20" />

      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle id="btn-theme-toggle-signup" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 dark:shadow-indigo-500/20">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Join FILER <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">AI</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
            Start organizing and understanding your documents with AI
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-gray-200/80 bg-white/95 p-6 shadow-2xl shadow-indigo-100/30 backdrop-blur-2xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-indigo-950/40">
          {error && (
            <div
              id="signup-error-alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/90 p-3.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-200"
              >
                Full Name
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="signup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  required
                  autoComplete="name"
                  className={`block w-full rounded-xl border bg-gray-50/70 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:bg-white focus:outline-none focus:ring-4 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 ${
                    name.length > 0 && !isNameValid(name)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60 dark:focus:border-red-400 dark:focus:ring-red-500/25'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-800 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/25'
                  }`}
                />
              </div>
              {name.length > 0 && !isNameValid(name) && (
                <p id="name-validation-hint" className="mt-1 text-[11px] text-red-500 dark:text-red-400">
                  Must be 2-50 characters with letters only (tokens like __t not allowed).
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-200"
              >
                Email Address
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  id="signup-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  required
                  autoComplete="email"
                  className={`block w-full rounded-xl border bg-gray-50/70 py-2.5 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:bg-white focus:outline-none focus:ring-4 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 ${
                    email.length > 0 && !isEmailValid(email)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60 dark:focus:border-red-400 dark:focus:ring-red-500/25'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-800 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/25'
                  }`}
                />
              </div>
              {email.length > 0 && !isEmailValid(email) && (
                <p id="email-validation-hint" className="mt-1 text-[11px] text-red-500 dark:text-red-400">
                  Please enter a valid email address (e.g. name@example.com).
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-gray-700 dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create secure password"
                  required
                  autoComplete="new-password"
                  className={`block w-full rounded-xl border bg-gray-50/70 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition focus:bg-white focus:outline-none focus:ring-4 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-950 ${
                    password.length > 0 && !isPasswordValid
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15 dark:border-red-500/60 dark:focus:border-red-400 dark:focus:ring-red-500/25'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/15 dark:border-slate-800 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/25'
                  }`}
                />
                <button
                  type="button"
                  id="toggle-signup-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password criteria checklist */}
              <div className="mt-2.5 space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-[11px] dark:border-slate-800/80 dark:bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      passwordChecks.length
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-300 dark:text-slate-600'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.length
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      passwordChecks.hasUpper && passwordChecks.hasLower
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-300 dark:text-slate-600'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasUpper && passwordChecks.hasLower
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    Uppercase & lowercase letters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      passwordChecks.hasNumber
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-300 dark:text-slate-600'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasNumber
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    At least one number (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 shrink-0 ${
                      passwordChecks.hasSpecial
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-300 dark:text-slate-600'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasSpecial
                        ? 'font-medium text-emerald-700 dark:text-emerald-400'
                        : 'text-gray-500 dark:text-slate-400'
                    }
                  >
                    At least one special character (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-signup-submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-indigo-500/20"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-6 border-t border-gray-100 pt-5 text-center dark:border-slate-800/80">
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Already have an account?{' '}
              <Link
                to="/login"
                id="link-to-login"
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Philosophy Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Upload • Understand • Organize • Retrieve • Interact</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
