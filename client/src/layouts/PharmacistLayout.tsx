import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  Pill,
  Users,
  ActivitySquare,
  FileCheck,
  LogOut,
  MessageSquare,
  ClipboardCheck,
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import LiveChatWidget from '../components/LiveChatWidget';
import { UserProfileDropdown } from '../components/layout/UserProfileDropdown';
import ClockWidget from '../components/layout/ClockWidget';

import { useAuth } from '../context/AuthContext';

/* ── Navigation items ───────────────────────────────────────────────── */
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: '/pharmacist', label: 'Clinical Overview', icon: <ActivitySquare size={20} /> },
  { path: '/pharmacist/prescriptions', label: 'Prescription Queue', icon: <FileCheck size={20} /> },
  { path: '/pharmacist/batches', label: 'Batch & Expiry Tracker', icon: <Pill size={20} /> },
  { path: '/pharmacist/patients', label: 'Patient Consultations', icon: <Users size={20} /> },
  { path: '/pharmacist/messages', label: 'Staff & Patient Chat', icon: <MessageSquare size={20} /> },
  { path: '/pharmacist/approval-queue', label: 'Approval Queue', icon: <ClipboardCheck size={20} /> },
];

/* ── Layout ─────────────────────────────────────────────────────────── */
const PharmacistLayout: React.FC = () => {
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
    'bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 shadow-sm shadow-emerald-500/10';
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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Pill size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Pharm<span className="text-emerald-400">Flow</span>
          </span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Clinical</span>

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
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/pharmacist'}
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
              Pharmacist Portal 🩺
            </h2>
          </div>

          {/* Right-side actions */}
          <div className="flex items-center gap-3">
            <ClockWidget />
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

export default PharmacistLayout;
