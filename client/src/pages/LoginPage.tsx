/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── PharmFlow — Login Page ──────────────────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Calls `login(email, password)` from AuthContext — the context owns the
 * API call and state update. This page only manages its own local UI state
 * (form values, loading, error display) and handles navigation on success.
 *
 * Role-based redirect:
 *   ADMIN, PHARMACIST, TECHNICIAN, CASHIER → /admin/dashboard
 *   CUSTOMER (or unknown role)             → /
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Pill, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Roles that belong to pharmacy staff — redirected to the admin panel. */
const STAFF_ROLES = new Set(['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']);

const LoginPage: React.FC = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,    setError]    = useState('');

  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // ── Already-authenticated guard ──────────────────────────────────────
  // Prevents a logged-in user from seeing the login form by immediately
  // redirecting them to the correct destination.
  // - Wait for hydration (`!loading`) AND for the `user` object to be fully
  //   populated in state, before evaluating role-based routing.
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const role = user.role;
      if (STAFF_ROLES.has(role)) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Delegate the API call and state update entirely to the context.
    const result = await login(email, password);

    setIsLoading(false);

    if (!result.success) {
      // Surface the server's specific error message inline.
      setError(result.error ?? 'Login failed. Please check your credentials.');
      return;
    }

    // Read role from the API result. By the time await login() resolves,
    // persist() has already written to localStorage AND called setToken/setUser.
    // The useEffect above will fire on the next render and navigate away.
    // We also call navigate() here directly as a belt-and-suspenders measure,
    // wrapped in a setTimeout to guarantee React Context has finished updating
    // before the route changes.
    const role = result.user?.role ?? '';
    
    console.log("LOGIN SUCCESS, REDIRECTING...");
    setTimeout(() => {
      if (STAFF_ROLES.has(role)) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }, 100);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 font-['Inter',sans-serif] px-4">
      {/* ── Ambient background glow ──────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/4 h-full w-3/4 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 h-full w-3/4 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* ── Brand header ───────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Pill size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to Pharm<span className="text-blue-400">Flow</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage your pharmacy operations
          </p>
        </div>

        {/* ── Login card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>

            {/* Error banner — shown only when the server returns an error */}
            {error && (
              <div
                role="alert"
                id="login-error"
                className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 animate-in fade-in duration-200"
              >
                <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="login-email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pharmacy.com"
                  aria-describedby={error ? 'login-error' : undefined}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300" htmlFor="login-password">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit button — disabled while loading or when fields are empty */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              aria-busy={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300 transition">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
