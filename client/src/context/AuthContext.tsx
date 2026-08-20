/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ─── Grace Pharmacy — Authentication Context ─────────────────────────────────
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Single source of truth for authentication state across the entire app.
 *
 * Design decisions:
 *  - The context OWNS the login/register/logout API calls. Pages never
 *    touch `api` directly for auth — they call context functions and react
 *    to the returned boolean. This eliminates the state split-brain where
 *    a page fires an API call but the context has stale state.
 *
 *  - localStorage keys are typed constants (LS_TOKEN / LS_USER) to prevent
 *    key-name typos across files from causing silent auth failures.
 *
 *  - The 401 response interceptor uses a stable `logoutRef` (useRef) instead
 *    of capturing `logout` in the closure — this prevents the stale-closure
 *    bug where the interceptor called an outdated version of `logout`.
 *
 *  - `loading` starts as `true` and flips to `false` only after the
 *    localStorage hydration check completes. This prevents ProtectedRoute
 *    from redirecting to /login on a hard refresh before state is restored.
 *
 *  - `isAuthenticated` is derived from `!!token` so it's always in sync
 *    with the token state — no separate boolean to keep in sync.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import api from '../services/api';

// ─── localStorage key constants ───────────────────────────────────────────────
// Use these everywhere — never inline the string literals.
export const LS_TOKEN = 'grace_pharmacy_token';
export const LS_USER  = 'grace_pharmacy_user';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the user object stored in state and localStorage. */
export interface AuthUser {
  id:            string;
  firstName:     string;
  lastName:      string;
  email:         string;
  role:          string;
  phone?:        string;
  licenseNumber?: string;
  isActive:      boolean;
}

/** Return type of login() and register() — callers check `success` not try/catch. */
export interface AuthResult {
  success: boolean;
  /** Human-readable error message when success === false. */
  error?: string;
  /**
   * The freshly-authenticated user returned directly from the API response.
   * Callers MUST use this for role-based routing instead of reading `user`
   * from context, because React state updates are asynchronous — context.user
   * is still null on the render cycle immediately after login() resolves.
   */
  user?: AuthUser;
}

interface AuthContextValue {
  /** Authenticated user document, or null when logged out. */
  user:            AuthUser | null;
  /** Raw JWT string, or null when logged out. */
  token:           string | null;
  /** Convenience flag — true when token is non-null. */
  isAuthenticated: boolean;
  /** True during the initial localStorage hydration check. */
  loading:         boolean;

  /**
   * Calls POST /auth/login, persists credentials, updates state.
   * Returns { success: true } on success, { success: false, error } on failure.
   */
  login:    (email: string, password: string) => Promise<AuthResult>;

  /**
   * Calls POST /auth/register, persists credentials, updates state.
   * Returns { success: true } on success, { success: false, error } on failure.
   */
  register: (
    name:     string,
    email:    string,
    password: string,
    role?:    string,
  ) => Promise<AuthResult>;

  /** Clears localStorage and resets all auth state. */
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Stable ref to `logout` — used inside the Axios interceptor to avoid
   * the stale-closure bug where a captured `logout` function is outdated.
   */
  const logoutRef = useRef<() => void>(() => {});

  // ── Persist helpers ────────────────────────────────────────────────────────

  const persist = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem(LS_TOKEN, newToken);
    localStorage.setItem(LS_USER,  JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const clear = () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    setToken(null);
    setUser(null);
  };

  // ── logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback((): void => {
    clear();
    // Explicitly clear the default Authorization header
    delete api.defaults.headers.common['Authorization'];
    // Immediately redirect the user
    window.location.href = '/login';
  }, []);

  // Keep the ref current so the interceptor always calls the latest version.
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // ── Hydrate from localStorage on mount ────────────────────────────────────
  // Runs once on mount. Sets loading=false in BOTH branches (success and error)
  // so ProtectedRoute is never stuck waiting indefinitely.

  useEffect(() => {
    const storedToken = localStorage.getItem(LS_TOKEN);
    const storedUser  = localStorage.getItem(LS_USER);

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        
        // Decode token to check expiration
        const tokenParts = storedToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            console.warn('[AuthContext] Token expired on load — clearing localStorage.');
            clear();
            setLoading(false);
            return;
          }
        }
        
        setToken(storedToken);
        setUser(parsedUser);
        // ✅ setLoading(false) called after successful hydration.
        setLoading(false);
      } catch {
        // Corrupted localStorage — wipe it to prevent being stuck in a bad state.
        console.error('[AuthContext] Failed to parse stored user — clearing localStorage.');
        clear();
        // ✅ setLoading(false) called even when hydration fails.
        setLoading(false);
      }
    } else {
      // No stored session — nothing to restore.
      // ✅ setLoading(false) called when there is no session to hydrate.
      setLoading(false);
    }
  }, []);

  // ── Axios 401 interceptor ──────────────────────────────────────────────────
  // Registered once. Uses logoutRef to avoid capturing a stale closure.

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('[AuthContext] 401 received — clearing auth state.');
          logoutRef.current();
        }
        return Promise.reject(error);
      },
    );

    // Clean up when the provider unmounts (e.g., during testing).
    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, []); // intentionally empty — runs once, uses ref for stable reference

  // ── login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const response = await api.post('/auth/login', { email, password });

        // ── DEBUG: log the full raw backend payload ──────────────────────
        console.log('[AuthContext] BACKEND RESPONSE:', response.data);

        // ── Normalise both common backend response shapes ────────────────
        //
        //   Shape A (nested):  { status, message, data: { token, user } }
        //   Shape B (flat):    { status, message, token, user }
        //
        // Using optional chaining on both paths means a shape mismatch will
        // produce `undefined` and fall through to the error below, rather
        // than throwing a cryptic "Cannot destructure property" TypeError.
        const payload = response.data;
        const newToken: string | undefined =
          payload?.data?.token ?? payload?.token;
        const newUser: AuthUser | undefined =
          payload?.data?.user  ?? payload?.user;

        if (!newToken || !newUser) {
          console.error(
            '[AuthContext] login: could not extract token/user from response.',
            'Received payload:', payload,
          );
          return {
            success: false,
            error: 'Unexpected response from server. Please try again.',
          };
        }

        // ── localStorage FIRST, then React state ────────────────────────
        // persist() already does this correctly:
        //   1. localStorage.setItem(LS_TOKEN, ...)  ← synchronous, immediate
        //   2. localStorage.setItem(LS_USER,  ...)  ← synchronous, immediate
        //   3. setToken(newToken)                   ← async, batched by React
        //   4. setUser(newUser)                     ← async, batched by React
        //
        // isAuthenticated in the context value is derived as:
        //   !!token || !!localStorage.getItem(LS_TOKEN)
        // so ProtectedRoute sees `true` the instant localStorage is written,
        // even before the React batch has flushed.
        persist(newToken, newUser);

        console.log('[AuthContext] login: persist() complete.', {
          token:     newToken.slice(0, 20) + '…',
          userRole:  newUser.role,
          userEmail: newUser.email,
        });

        // Return the freshly-extracted user to the caller.
        // LoginPage MUST use this value for role-based routing — never
        // read context.user after login() resolves, it will still be null
        // until React flushes its batch on the next render cycle.
        return { success: true, user: newUser };

      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ??
          'Login failed. Please check your credentials and try again.';

        console.error('[AuthContext] login error:', err);
        return { success: false, error: message };
      }
    },
    [],
  );

  // ── register ───────────────────────────────────────────────────────────────

  const register = useCallback(
    async (
      name:     string,
      email:    string,
      password: string,
      role?:    string,
    ): Promise<AuthResult> => {
      try {
        const response = await api.post('/auth/register', {
          name,       // Backend splits this into firstName / lastName
          email,
          password,
          role,
        });

        console.log('[AuthContext] REGISTER BACKEND RESPONSE:', response.data);

        // Same dual-shape normalisation as login()
        const payload  = response.data;
        const newToken: string | undefined =
          payload?.data?.token ?? payload?.token;
        const newUser: AuthUser | undefined =
          payload?.data?.user  ?? payload?.user;

        if (!newToken || !newUser) {
          console.error(
            '[AuthContext] register: could not extract token/user from response.',
            'Received payload:', payload,
          );
          return {
            success: false,
            error: 'Unexpected response from server. Please try again.',
          };
        }

        persist(newToken, newUser);
        return { success: true, user: newUser };

      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message ??
          'Registration failed. Please try again.';

        console.error('[AuthContext] register error:', err);
        return { success: false, error: message };
      }
    },
    [],
  );

  // ── Context value ──────────────────────────────────────────────────────────
  //
  // isAuthenticated is derived from BOTH React state (token) AND localStorage.
  //
  // Why the OR condition?
  //   React state updates (setToken) are asynchronous — they batch and flush
  //   on the next render. When persist() calls setToken() and then login()
  //   returns, the calling page immediately calls navigate(). ProtectedRoute
  //   re-renders in the same batch and may still see the OLD token value
  //   (null), causing a premature /login redirect — the redirect loop.
  //
  //   localStorage.getItem() is synchronous and reflects the new value
  //   immediately after persist() calls localStorage.setItem(). So by OR-ing
  //   the two sources, isAuthenticated is true the moment the token is written
  //   to storage, regardless of whether React has flushed the state update yet.

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: !!token || !!localStorage.getItem(LS_TOKEN),
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the authentication context.
 * Must be called inside a component that is a descendant of `AuthProvider`.
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>.');
  }
  return context;
};
