import React from 'react';
import {
  ClipboardList, Archive, FileBarChart, ArrowRight,
  Package, CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const quickLinks = [
    {
      title: 'Pick List Queue',
      description: 'View and fulfill pending medication pick requests from pharmacists.',
      icon: ClipboardList,
      color: 'blue',
      path: '/admin/pick-list',
      bgClass: 'bg-blue-500/10',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/20',
    },
    {
      title: 'Shelf Directory',
      description: 'Browse and manage shelf locations, bins, and storage assignments.',
      icon: Archive,
      color: 'emerald',
      path: '/admin/shelf-directory',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/20',
    },
    {
      title: 'Cycle Count',
      description: 'Perform and submit physical inventory cycle counts.',
      icon: FileBarChart,
      color: 'amber',
      path: '/admin/cycle-count',
      bgClass: 'bg-amber-500/10',
      textClass: 'text-amber-400',
      borderClass: 'border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1">Technician dashboard — manage inventory tasks and fulfillment.</p>
      </header>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
          <div className="p-3 rounded-xl bg-slate-800 text-blue-400">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Pick Lists</p>
            <p className="text-2xl font-bold text-white mt-1">—</p>
            <p className="text-[10px] text-slate-500">Pending fulfillment</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
          <div className="p-3 rounded-xl bg-slate-800 text-amber-400">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Cycle Counts</p>
            <p className="text-2xl font-bold text-white mt-1">—</p>
            <p className="text-[10px] text-slate-500">Due this week</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
          <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Shelves Managed</p>
            <p className="text-2xl font-bold text-white mt-1">—</p>
            <p className="text-[10px] text-slate-500">Active locations</p>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quickLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`group relative flex flex-col p-6 rounded-2xl border ${link.borderClass} bg-slate-900/60 backdrop-blur shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all text-left`}
          >
            <div className={`p-3 rounded-xl ${link.bgClass} w-fit mb-4`}>
              <link.icon size={24} className={link.textClass} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
              {link.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed flex-1">
              {link.description}
            </p>
            <div className="flex items-center gap-1 mt-4 text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors">
              Open <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Messages Link */}
      <button
        onClick={() => navigate('/admin/messages')}
        className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur shadow-xl hover:bg-slate-800/60 transition-all group text-left"
      >
        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Staff Messages</h3>
          <p className="text-xs text-slate-500 mt-0.5">Communicate with pharmacists and other staff members.</p>
        </div>
        <ArrowRight size={16} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
      </button>
    </div>
  );
};

export default TechnicianDashboard;
