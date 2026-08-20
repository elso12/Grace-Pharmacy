import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'PHARMACIST': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'TECHNICIAN': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'CASHIER': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'CUSTOMER': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

const UserProfileMenu: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Trigger */}
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-full pl-2 pr-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
        </div>
        <div className="hidden sm:flex flex-col items-start leading-none">
          <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">
            {user.firstName}
          </span>
        </div>
        <span className={`hidden sm:inline-flex ml-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getRoleBadgeColor(user.role)}`}>
          {user.role}
        </span>
        <ChevronDown size={14} className="text-slate-400 ml-1" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
            <div className="mt-2 inline-flex items-center">
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="group flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} className="text-rose-500 group-hover:text-rose-600" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
