import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Menu,
  X,
  Pill,
  Users,
  ActivitySquare,
  FileCheck,
  Archive,
  FileBarChart,
  TrendingUp,
  Settings,
  LogOut,
  ShoppingBag,
  MessageSquare,
  Truck,
  ClipboardCheck,
  Database,
  ShieldAlert,
  Activity,
  ShieldCheck
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import LiveChatWidget from './LiveChatWidget';
import { UserProfileDropdown } from './layout/UserProfileDropdown';

import { useAuth } from '../context/AuthContext';

/* ── Navigation items ───────────────────────────────────────────────── */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  hideForRoles?: string[];
  roles?: string[];
}

const navItems: NavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER'] },
  { path: '/admin/messages', label: 'Messages', icon: <MessageSquare size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN', 'CASHIER'] },
  { path: '/admin/pos', label: 'POS Terminal', icon: <ShoppingCart size={20} />, roles: ['ADMIN', 'CASHIER', 'PHARMACIST'] },
  { path: '/admin/prescriptions', label: 'Rx Queue', icon: <FileCheck size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/approval-queue', label: 'Approval Queue', icon: <ClipboardCheck size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/batch-tracker', label: 'Batch Tracker', icon: <ActivitySquare size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/patient-history', label: 'Patient History', icon: <Users size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/pick-list', label: 'Pick List Queue', icon: <FileCheck size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN'] },
  { path: '/admin/shelf-directory', label: 'Shelf Directory', icon: <Archive size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN'] },
  { path: '/admin/cycle-count', label: 'Cycle Count', icon: <FileBarChart size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN'] },
  { path: '/admin/products', label: 'Medications', icon: <Pill size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/inventory', label: 'Inventory', icon: <Package size={20} />, roles: ['ADMIN', 'PHARMACIST'] },
  { path: '/admin/reports', label: 'Reports', icon: <TrendingUp size={20} />, roles: ['ADMIN'] },
  { path: '/admin/orders', label: 'Orders', icon: <ShoppingBag size={20} />, roles: ['ADMIN', 'PHARMACIST', 'TECHNICIAN'] },
  { path: '/admin/suppliers', label: 'Suppliers', icon: <Truck size={20} />, roles: ['ADMIN'] },
  { path: '/admin/users', label: 'Users & Roles', icon: <Users size={20} />, roles: ['ADMIN'] },
  { path: '/admin/audit', label: 'Audit Logs', icon: <Settings size={20} />, roles: ['ADMIN'] },
  { path: '/admin/compliance', label: 'Compliance', icon: <ShieldAlert size={20} />, roles: ['ADMIN'] },
  { path: '/admin/procurement', label: 'Procurement', icon: <Truck size={20} />, roles: ['ADMIN'] },
  { path: '/admin/insurance', label: 'Insurance Claims', icon: <ShieldCheck size={20} />, roles: ['ADMIN'] },
  { path: '/admin/pnl-reports', label: 'P&L Statement', icon: <Activity size={20} />, roles: ['ADMIN'] },
  { path: '/admin/data-migration', label: 'Data Migration', icon: <Database size={20} />, roles: ['ADMIN'] },
  { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} />, roles: ['ADMIN'] },
];

/* ── Layout ─────────────────────────────────────────────────────────── */
const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const handleLogout = () => {
    logout();
  };

  const initials = user?.firstName
    ? (user.firstName[0] || '') + (user.lastName?.[0] || 'U')
    : 'U';

  const linkBase =
    'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200';
  const linkActive =
    'bg-gradient-to-r from-blue-600/20 to-indigo-600/10 text-blue-400 shadow-sm shadow-blue-500/10';
  const linkInactive =
    'text-slate-400 hover:bg-white/5 hover:text-slate-200';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-['Inter',sans-serif]">
      {/* ── Sidebar overlay (mobile) ─────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex w-72 flex-col
          border-r border-white/[0.06] bg-slate-900/80 backdrop-blur-xl
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Pill size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Pharm<span className="text-blue-400">Flow</span>
          </span>

          {/* Close button – mobile only */}
          <button
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1 space-y-1 px-3">
          {navItems
            .filter((item) => item.roles ? item.roles.includes(user?.role || '') : !item.hideForRoles?.includes(user?.role || ''))
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.04] p-2 hover:bg-white/[0.08] transition-colors cursor-pointer group" onClick={handleLogout}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-500 capitalize truncate">
                {user?.role.toLowerCase()}
              </p>
            </div>
            <button 
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.06] bg-slate-900/60 px-4 backdrop-blur-xl sm:px-6">
          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>

          {/* Page title area — can be made dynamic via context / props */}
          <div className="hidden lg:block">
            <h2 className="text-sm font-semibold text-slate-200">
              Welcome back 👋
            </h2>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell />

            {/* Avatar */}
            <UserProfileDropdown />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <LiveChatWidget />
    </div>
  );
};

export default Layout;
