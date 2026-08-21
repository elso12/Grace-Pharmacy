import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LogOut, 
  ShieldCheck, 
  ChevronDown, 
  Settings, 
  Sparkles 
} from 'lucide-react';

export const UserProfileDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
      case 'PHARMACIST':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'TECHNICIAN':
        return 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800';
      case 'CASHIER':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getDashboardRoute = (role: string) => {
    switch (role) {
      case 'ADMIN': return '/admin';
      case 'PHARMACIST': return '/pharmacist';
      case 'TECHNICIAN': return '/technician';
      case 'CASHIER': return '/pos';
      default: return '/customer/orders';
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || 'U');

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-semibold text-xs flex items-center justify-center shadow-inner">
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
        </div>

        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
            {fullName}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
            {user.role.toLowerCase()}
          </span>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 p-1.5 divide-y divide-slate-100 dark:divide-slate-800">
          {/* User Details Header */}
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-sm flex items-center justify-center">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {fullName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Active Session
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(getDashboardRoute(user.role));
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Role Dashboard
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              Account Settings
            </button>
          </div>

          {/* Logout Action */}
          <div className="pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors group"
            >
              <LogOut className="w-4 h-4 text-red-500 transition-transform group-hover:-translate-x-0.5" />
              Sign Out / Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
