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
      navigate('/', { replace: true });
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 p-4 sm:p-6 lg:p-8 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle id="btn-theme-toggle-signup" />
      </div>

      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">
            Join FILER <span className="text-indigo-600 dark:text-indigo-400">AI</span>
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Start organizing and understanding your documents with AI
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-100 bg-white/95 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
          {error && (
            <div
              id="signup-error-alert"
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-gray-700"
              >
                Full Name
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
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
                  className={`block w-full rounded-xl border bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    name.length > 0 && !isNameValid(name)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {name.length > 0 && !isNameValid(name) && (
                <p id="name-validation-hint" className="mt-1 text-[11px] text-red-500">
                  Must be 2-50 characters with letters only (tokens like __t not allowed).
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="signup-email"
                className="block text-xs font-semibold text-gray-700"
              >
                Email Address
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
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
                  className={`block w-full rounded-xl border bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    email.length > 0 && !isEmailValid(email)
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
              </div>
              {email.length > 0 && !isEmailValid(email) && (
                <p id="email-validation-hint" className="mt-1 text-[11px] text-red-500">
                  Please enter a valid email address (e.g. name@example.com).
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1.5 rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
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
                  className={`block w-full rounded-xl border bg-gray-50/50 py-2.5 pl-10 pr-10 text-sm text-gray-900 transition focus:bg-white focus:outline-none focus:ring-2 ${
                    password.length > 0 && !isPasswordValid
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                  }`}
                />
                <button
                  type="button"
                  id="toggle-signup-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password criteria checklist */}
              <div className="mt-2.5 space-y-1 rounded-xl bg-gray-50/80 p-2.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordChecks.length ? 'text-emerald-600' : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.length ? 'text-emerald-700 font-medium' : 'text-gray-500'
                    }
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordChecks.hasUpper && passwordChecks.hasLower
                        ? 'text-emerald-600'
                        : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasUpper && passwordChecks.hasLower
                        ? 'text-emerald-700 font-medium'
                        : 'text-gray-500'
                    }
                  >
                    Uppercase & lowercase letters
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordChecks.hasNumber ? 'text-emerald-600' : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasNumber ? 'text-emerald-700 font-medium' : 'text-gray-500'
                    }
                  >
                    At least one number (0-9)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3 w-3 ${
                      passwordChecks.hasSpecial ? 'text-emerald-600' : 'text-gray-300'
                    }`}
                  />
                  <span
                    className={
                      passwordChecks.hasSpecial ? 'text-emerald-700 font-medium' : 'text-gray-500'
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
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:from-indigo-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
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
          <div className="mt-6 border-t border-gray-100 pt-5 text-center">
            <p className="text-xs text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                id="link-to-login"
                className="font-semibold text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Philosophy Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          <span>Upload • Understand • Organize • Retrieve • Interact</span>
        </div>
      </div>
    </div>
  );
};

export default Signup;
