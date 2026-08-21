import React, { useState, useEffect } from 'react';
import { Download, TrendingUp, DollarSign, CreditCard, Activity, Calendar, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

interface FinancialSummary {
  dailyRevenue: number;
  monthlyRevenue: number;
  revenueByPaymentMethod: { method: string; total: number }[];
  topSellingMedications: { name: string; quantity: number; revenue: number }[];
}

const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/analytics/financial-summary');
      setSummary(data.data);
    } catch (err) {
      console.error('Failed to fetch financial summary:', err);
      setError('Could not load financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExport = () => {
    let url = `/analytics/export?format=csv`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    api.get(url, { responseType: 'blob' })
      .then(response => {
        const _url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = _url;
        link.setAttribute('download', 'sales-report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(err => {
        console.error('Failed to download report', err);
        alert('Failed to download report');
      });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 space-y-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-500" />
            Financial Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of pharmacy revenue and top-selling products.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl px-2 shadow-sm">
            <Calendar className="h-4 w-4 text-slate-500 mr-2" />
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-slate-300 py-2 outline-none [color-scheme:dark]"
            />
            <span className="text-slate-500 mx-2">to</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-slate-300 py-2 outline-none [color-scheme:dark]"
            />
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition-all"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <ShieldAlert className="h-8 w-8 animate-pulse text-blue-500" />
        </div>
      ) : error ? (
        <div className="p-8 text-center text-rose-400">{error}</div>
      ) : summary ? (
        <>
          {/* ── Summary Cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><DollarSign size={20} /></div>
                <h3 className="text-sm font-medium text-slate-400">Daily Revenue</h3>
              </div>
              <p className="text-2xl font-bold text-white">${summary.dailyRevenue.toFixed(2)}</p>
            </div>
            
            <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400"><TrendingUp size={20} /></div>
                <h3 className="text-sm font-medium text-slate-400">Monthly Revenue</h3>
              </div>
              <p className="text-2xl font-bold text-white">${summary.monthlyRevenue.toFixed(2)}</p>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-5 shadow-xl flex items-center gap-6">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400"><CreditCard size={24} /></div>
              <div className="flex-1 flex gap-8">
                {summary.revenueByPaymentMethod.map(pm => (
                  <div key={pm.method}>
                    <p className="text-xs font-medium text-slate-400 uppercase">{pm.method.replace('_', ' ')}</p>
                    <p className="text-lg font-bold text-slate-200">${pm.total.toFixed(2)}</p>
                  </div>
                ))}
                {summary.revenueByPaymentMethod.length === 0 && (
                  <p className="text-sm text-slate-500">No payment data available.</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Top Selling Medications Table ──────────────────────────────── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden pb-8">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Top Selling Medications</h2>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/50 text-slate-500 sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Medication Name</th>
                    <th className="px-6 py-4 font-semibold text-right">Quantity Sold</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {summary.topSellingMedications.length > 0 ? (
                    summary.topSellingMedications.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-200">{med.name}</td>
                        <td className="px-6 py-4 text-right">{med.quantity} units</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-400">${med.revenue.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                        No sales data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ReportsPage;
