import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, DollarSign, Clock, Receipt,
  ArrowRight, Loader2, TrendingUp, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const CashierDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayRevenue: 0,
    recentReceipts: [] as { id: string; invoiceNumber: string; totalAmount: number; createdAt: string; customerName: string }[],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try to fetch dashboard data; gracefully handle if endpoints aren't available
        const { data } = await api.get('/analytics/dashboard');
        setStats({
          todaySales: data.data?.totalOrders || 0,
          todayRevenue: data.data?.totalRevenue || 0,
          recentReceipts: data.data?.recentTransactions?.slice(0, 5) || [],
        });
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {greeting}, {user?.firstName} 👋
        </h1>
        <p className="text-slate-400 mt-1">Cashier dashboard — quick access to your POS terminal and shift summary.</p>
      </header>

      {/* Quick Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
            <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Today's Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
            <div className="p-3 rounded-xl bg-slate-800 text-blue-400">
              <Receipt size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Transactions</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.todaySales}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
            <div className="p-3 rounded-xl bg-slate-800 text-amber-400">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Current Time</p>
              <p className="text-2xl font-bold text-white mt-1">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Open POS Button */}
      <button
        onClick={() => navigate('/admin/pos')}
        className="w-full group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-600 to-indigo-600 p-8 shadow-2xl shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur">
              <ShoppingCart size={32} className="text-white" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-white">Open POS Terminal</h2>
              <p className="text-blue-200 text-sm mt-1">Start processing sales and transactions</p>
            </div>
          </div>
          <ArrowRight size={28} className="text-white/70 group-hover:translate-x-1 transition-transform" />
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-lg" />
      </button>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/admin/pos/shift-close')}
          className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur shadow-xl hover:bg-slate-800/60 transition-all group text-left"
        >
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Close Shift</h3>
            <p className="text-xs text-slate-500 mt-0.5">End your current shift and view shift summary.</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-500 group-hover:text-blue-400 transition-colors" />
        </button>

        <button
          onClick={() => navigate('/admin/messages')}
          className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.08] bg-slate-900/60 backdrop-blur shadow-xl hover:bg-slate-800/60 transition-all group text-left"
        >
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Zap size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">Messages</h3>
            <p className="text-xs text-slate-500 mt-0.5">Communicate with pharmacists and staff.</p>
          </div>
          <ArrowRight size={16} className="ml-auto text-slate-500 group-hover:text-blue-400 transition-colors" />
        </button>
      </div>

      {/* Recent Receipts */}
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Recent Receipts</h2>
        {stats.recentReceipts.length === 0 ? (
          <div className="text-sm text-slate-500 text-center py-8">No recent transactions</div>
        ) : (
          <div className="space-y-3">
            {stats.recentReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/[0.04]">
                <div>
                  <p className="text-sm font-semibold text-white">{receipt.customerName || 'Walk-in'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(receipt.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-400">+${receipt.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CashierDashboard;
