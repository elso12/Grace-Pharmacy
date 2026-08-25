/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Grace Pharmacy — Register Page ───────────────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Calls `register(name, email, password, role)` from AuthContext — the
 * context owns the API call, response parsing, and state persistence.
 * This page manages only its local UI state (form values, loading, errors).
 *
 * Field notes:
 *   - `firstName` + `lastName` are collected separately for UX clarity, then
 *     joined into a single `name` string before calling context.register().
 *     The backend controller accepts `name` and splits it automatically.
 *
 * Role-based redirect (same logic as LoginPage):
 *   ADMIN, PHARMACIST, TECHNICIAN, CASHIER → /admin/dashboard
 *   CUSTOMER                                → /
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Pill,
  Loader2,
  AlertCircle,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/** Roles that belong to pharmacy staff — redirected to the admin panel. */
const STAFF_ROLES = new Set(['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER']);

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    phone:     '',
    address:   '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');

  const { register, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  // ── Already-authenticated guard ──────────────────────────────────────
  // Wait for hydration AND for `user` to be fully populated in state.
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const activeRole = user.role;
      if (STAFF_ROLES.has(activeRole)) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    // Clear error as soon as the user starts correcting their input.
    if (error) setError('');
  };

  // ── Client-side validation ────────────────────────────────────────────────
  // A lightweight pre-flight check before hitting the network. The server
  // does its own validation too — this just gives instant feedback.
  const validate = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required.';
    if (!formData.lastName.trim())  return 'Last name is required.';
    if (!formData.email.trim())     return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return 'Please enter a valid email address.';
    if (!formData.password)         return 'Password is required.';
    if (formData.password.length < 8)
      return 'Password must be at least 8 characters long.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Run client-side validation first.
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    // Join firstName + lastName into a single `name` field.
    // The backend controller splits it back into firstName / lastName.
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

    const result = await register(
      fullName,
      formData.email.trim(),
      formData.password,
      'CUSTOMER'
    );

    setIsLoading(false);

    if (!result.success) {
      setError(result.error ?? 'Registration failed. Please try again.');
      return;
    }

    // Registration is strictly for CUSTOMER accounts now.
    navigate('/', { replace: true });
  };

  // Whether the form can be submitted (all required fields filled).
  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim()  &&
    formData.email.trim()     &&
    formData.password.length >= 8;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 font-['Inter',sans-serif] px-4 py-8">
      {/* ── Ambient background glow ──────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-1/2 -left-1/4 h-full w-3/4 rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-1/2 -right-1/4 h-full w-3/4 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* ── Brand header ───────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Pill size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Join Pharm<span className="text-blue-400">Flow</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Create an account to access the system
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-500/20 text-xs font-medium text-blue-300">
            <User size={14} />
            Creating a Patient / Customer Account
          </div>
        </div>

        {/* ── Register card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
                id="register-error"
                className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300 animate-in fade-in duration-200"
              >
                <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <p>{error}</p>
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              {/* First name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="reg-firstName">
                  First Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-firstName"
                    name="firstName"
                    type="text"
                    required
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jane"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Last name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300" htmlFor="reg-lastName">
                  Last Name
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                    aria-hidden="true"
                  />
                  <input
                    id="reg-lastName"
                    name="lastName"
                    type="text"
                    required
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="reg-email">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jane@pharmacy.com"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                />
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
              {/* Password strength hint */}
              {formData.password.length > 0 && (
                <p className={`flex items-center gap-1.5 text-xs transition ${
                  formData.password.length >= 8 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  <CheckCircle2 size={12} aria-hidden="true" />
                  {formData.password.length >= 8
                    ? 'Password strength: good'
                    : `${8 - formData.password.length} more characters needed`}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="reg-phone">
                Phone Number
              </label>
              <div className="relative">
                <input
                  id="reg-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 px-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300" htmlFor="reg-address">
                Delivery Address
              </label>
              <div className="relative">
                <input
                  id="reg-address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Main St, City"
                  disabled={isLoading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-2.5 px-4 text-sm text-white placeholder-slate-500 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading || !isFormValid}
              aria-busy={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300 transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
