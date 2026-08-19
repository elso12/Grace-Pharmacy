/**
 * ─── ProtectedRoute ───────────────────────────────────────────────────────────
 *
 * Guards all routes under /admin. Three-phase logic:
 *
 *  Phase 1 — loading === true
 *    AuthContext is still reading localStorage. Do NOT make a routing decision
 *    yet. Render a loading screen so the user never sees a flicker or a
 *    premature redirect to /login on a hard refresh.
 *
 *  Phase 2 — loading === false, isAuthenticated === false
 *    Hydration is complete and there is no valid session. Redirect to /login.
 *    The current location is passed in state so LoginPage can send the user
 *    back to the page they were trying to reach after they log in.
 *
 *  Phase 3 — loading === false, isAuthenticated === true
 *    Valid session confirmed. Render the child routes.
 *
 * Key invariant:
 *   This component NEVER calls navigate() while loading === true.
 *   All routing decisions wait until AuthContext has finished hydrating.
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] PROTECTED ROUTE CHECK:', { isAuthenticated, loading });

  // ── Phase 1: Hydration in progress — hold on, don't redirect ─────────────
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-950 text-slate-400 text-sm">
        Loading...
      </div>
    );
  }

  // ── Phase 2: No session — send to login ───────────────────────────────────
  if (!isAuthenticated) {
    // Preserve the attempted URL so LoginPage can redirect back after login.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Phase 3: RBAC Check (if roles are specified) ──────────────────────────
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User is logged in but unauthorized for this route.
    console.warn(`[ProtectedRoute] Access denied for role: ${user.role}`);
    
    // Redirect users to their dedicated portal, rather than dropping them on the login page or generic 403
    if (user.role === 'CUSTOMER') {
      return <Navigate to="/patient-portal" replace />;
    }
    if (user.role === 'CASHIER') {
      return <Navigate to="/admin/pos" replace />;
    }
    if (user.role === 'PHARMACIST' || user.role === 'TECHNICIAN') {
      return <Navigate to="/admin/prescriptions" replace />;
    }
    
    return <Navigate to="/login" replace />;
  }

  // ── Phase 4: Authenticated & Authorized — render children ─────────────────
  return <Outlet />;
};

export default ProtectedRoute;
