/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── PharmFlow — Axios API Client ───────────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single Axios instance used by the entire application.
 *
 * Request interceptor:
 *   Reads the JWT from localStorage and injects it as a Bearer token on
 *   every outgoing request. This means no component or context function
 *   needs to manually set the Authorization header.
 *
 * Response interceptor:
 *   Centralises 401 handling. Note: the actual logout() call lives in
 *   AuthContext (which registers its own response interceptor) to keep
 *   this file router/context-agnostic and independently testable.
 *   This interceptor only logs the warning; AuthContext handles the logout.
 *
 * Timeout:
 *   15 seconds — generous enough for slow connections, tight enough to
 *   surface backend hangs quickly in development.
 */

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { LS_TOKEN } from '../context/AuthContext';

// ── Base URL ──────────────────────────────────────────────────────────────────
// Falls back to the local server when VITE_API_BASE_URL is not set.
const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

// ── Axios instance ────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL:         API_BASE_URL,
  timeout:         15_000,
  withCredentials: true,   // sends cookies when the backend uses them
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT Bearer token ─────────────────────────────
//
// Reads the token from localStorage on every request so that:
//  1. The interceptor always uses the latest token (e.g., after a silent refresh).
//  2. No component or context function needs to pass the token manually.
//
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem(LS_TOKEN);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor — surface 401s ───────────────────────────────────────
//
// Logs the warning here. The actual state-clearing logout() is handled by the
// interceptor registered in AuthContext, which has access to React state.
// Keeping both is intentional: this layer handles infrastructure concerns,
// AuthContext handles application state concerns.
//
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[api] 401 Unauthorized — token may be expired or invalid.');
      // AuthContext's interceptor will call logout() to clear state.
    }

    if (error.response?.status === 403) {
      console.warn('[api] 403 Forbidden — insufficient permissions for this action.');
    }

    if (!error.response) {
      // Network error or server completely unreachable.
      console.error('[api] Network error — server may be down:', error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
