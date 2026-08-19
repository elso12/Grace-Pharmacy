import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, ShoppingBag, Users, TrendingUp, AlertTriangle, Loader2, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProfit: 0,
    valueAtRisk: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
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
    { label: 'Total Revenue', value: `$${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Total Profit (Est)', value: `$${analytics.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: 'text-indigo-400' },
    { label: 'Total Orders', value: analytics.totalOrders.toLocaleString(), icon: ShoppingBag, color: 'text-blue-400' },
    { label: 'Value At Risk (<90d)', value: `$${analytics.valueAtRisk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: AlertTriangle, color: 'text-rose-400' },
    { label: 'Action Required (Low Stock)', value: analytics.lowStockCount.toLocaleString(), icon: Package, color: 'text-amber-400' },
  ];

  const quickLinks = [
    { title: 'Inventory (FEFO)', path: '/admin/inventory', icon: Package, desc: 'Manage stock and expiration dates' },
    { title: 'Orders', path: '/admin/orders', icon: ShoppingBag, desc: 'View and process customer orders' },
    { title: 'Users', path: '/admin/users', icon: Users, desc: 'Manage staff and customer accounts' },
  ];

  const handleExport = async (type: 'csv' | 'pdf') => {
    try {
      const endpoint = type === 'csv' ? '/reports/sales/csv' : '/reports/inventory/pdf';
      const response = await api.get(endpoint, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', type === 'csv' ? 'sales-report.csv' : 'inventory-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(`Failed to export ${type.toUpperCase()}`, err);
      alert(`Failed to export ${type.toUpperCase()}`);
    }
  };

  // Mock data for charts
  const revenueData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const pieData = [
    { name: 'Safe', value: 400 },
    { name: 'Near Expiry', value: 300 },
    { name: 'Expired', value: 300 },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Welcome Header ───────────────────────────────────────────────── */}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome to the Pharmacy Control Panel,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            {user?.firstName}
          </span>
          👋
        </h1>
        <p className="text-slate-400">
          Here is your overview of pharmacy operations, sales, and alerts for today.
        </p>
      </header>

      <div className="flex items-center gap-3">
        <button onClick={() => handleExport('csv')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700">
          <Download size={16} /> Export CSV
        </button>
        <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700">
          <FileText size={16} /> Export PDF
        </button>
      </div>

      {/* ── Top Stats Row ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 backdrop-blur shadow-xl shadow-black/20"
            >
              <div className={`p-2.5 rounded-xl bg-slate-800 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400">{stat.label}</p>
                <p className="text-lg font-bold text-white mt-0.5">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts Row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">7-Day Revenue Trend</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-span-1 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6">Inventory Risk</h2>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Safe</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Near Expiry</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Expired</div>
          </div>
        </div>
      </div>

      {/* ── Quick Links / "Simple Sidebar" alternatives ──────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.path}
              className="group flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 backdrop-blur transition-all hover:bg-slate-800/80 hover:border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <link.icon size={20} />
                </div>
                <h3 className="font-semibold text-white">{link.title}</h3>
              </div>
              <p className="text-sm text-slate-400">
                {link.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
