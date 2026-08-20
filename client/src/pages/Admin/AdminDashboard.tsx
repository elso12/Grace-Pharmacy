import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, Loader2, Pill, Plus, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    expiringBatchesCount: 0,
    recentTransactions: [],
    salesTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Analytics endpoint maps to /analytics/dashboard but the route in app.ts mounts at /api/analytics
        // wait, earlier we checked analyticsController.ts, it doesn't specify route. I'll use /analytics/summary
        const { data } = await api.get('/analytics/summary');
        setAnalytics(data.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const stats = [
    { label: 'Total Revenue', value: `$${(analytics.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Total Orders', value: (analytics.totalOrders || 0).toLocaleString(), icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Low Stock Alerts', value: (analytics.lowStockCount || 0).toLocaleString(), icon: AlertTriangle, color: 'text-rose-400' },
    { label: 'Expiring Batches (30d)', value: (analytics.expiringBatchesCount || 0).toLocaleString(), icon: Package, color: 'text-amber-400' },
  ];

  // Format chart data
  const revenueData = (analytics.salesTrend || []).map((item: any) => {
    const d = new Date(item.date);
    return {
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: item.revenue
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Welcome Header ───────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.firstName}. Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all">
            <Plus size={16} /> Add Medication
          </button>
          <button onClick={() => navigate('/admin/inventory')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl shadow-lg transition-all border border-slate-700">
            <Plus size={16} /> Add Batch / Stock
          </button>
          <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl shadow-lg transition-all border border-slate-700">
            <Plus size={16} /> New Staff Account
          </button>
        </div>
      </header>

      {/* ── Top Stats Row ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 backdrop-blur shadow-xl shadow-black/20">
              <div className={`p-3 rounded-xl bg-slate-800 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts & Tables ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Chart */}
        <div className="xl:col-span-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">7-Day Revenue Trend</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} width={60} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="xl:col-span-1 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            <Link to="/admin/pos" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
              </div>
            ) : analytics.recentTransactions?.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-10">No recent transactions</div>
            ) : (
              <div className="space-y-4">
                {analytics.recentTransactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-white/[0.04]">
                    <div>
                      <p className="text-sm font-semibold text-white">{tx.customerName}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                          {tx.type}
                        </span>
                        {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">+${tx.amount.toFixed(2)}</p>
                      <p className="text-xs font-medium text-slate-500 capitalize">{tx.paymentMethod.replace('_', ' ').toLowerCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
