import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Download, Calendar, Plus } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PnLReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of the month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [pnlData, setPnlData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const fetchPnL = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/financials/pnl-statement', {
        params: { startDate, endDate }
      });
      setPnlData(data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch P&L statement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPnL();
  }, [startDate, endDate]);

  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'RENT',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financials/expenses', {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      toast.success('Expense logged successfully');
      setShowExpenseModal(false);
      setExpenseForm({ title: '', category: 'RENT', amount: '', date: new Date().toISOString().split('T')[0] });
      fetchPnL();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to log expense');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-500" />
            Profit & Loss (P&L) Statement
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive financial performance tracking including COGS and OPEX.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-3">
          <div className="flex items-center space-x-2 bg-slate-900/60 p-2 rounded-xl border border-white/[0.06] backdrop-blur">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-sm text-white border-none outline-none focus:ring-0"
            />
            <span className="text-slate-500">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-sm text-white border-none outline-none focus:ring-0"
            />
          </div>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl shadow-sm text-sm font-medium text-white hover:bg-slate-700 transition"
          >
            <Plus className="w-4 h-4 mr-2 text-rose-400" />
            Log Expense
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : pnlData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl">
              <p className="text-sm text-slate-400 font-medium mb-1">Gross Sales Revenue</p>
              <p className="text-3xl font-bold text-emerald-400">${pnlData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl">
              <p className="text-sm text-slate-400 font-medium mb-1">Cost of Goods Sold (COGS)</p>
              <p className="text-3xl font-bold text-rose-400">-${pnlData.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl">
              <p className="text-sm text-slate-400 font-medium mb-1 flex items-center justify-between">
                Gross Profit
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">
                  {pnlData.grossProfitMargin.toFixed(1)}% Margin
                </span>
              </p>
              <p className="text-3xl font-bold text-indigo-400">${pnlData.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-slate-900/60 p-6 rounded-2xl border border-white/[0.06] backdrop-blur shadow-xl">
              <p className="text-sm text-slate-400 font-medium mb-1">Operating Expenses (OPEX)</p>
              <p className="text-3xl font-bold text-rose-400">-${pnlData.opex.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-slate-900/60 p-8 rounded-2xl border border-emerald-500/30 backdrop-blur shadow-[0_0_20px_rgba(16,185,129,0.1)] flex flex-col md:flex-row items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm font-bold uppercase tracking-wider mb-2">Net Profit (EBIT)</p>
              <div className="flex items-end gap-4">
                <p className="text-5xl font-black text-white">${pnlData.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <div className="flex items-center text-emerald-400 mb-2 font-bold">
                  {pnlData.netProfit >= 0 ? <TrendingUp className="mr-1" /> : <TrendingDown className="mr-1 text-rose-500" />}
                  <span className={pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}>{pnlData.netProfitMargin.toFixed(1)}%</span>
                </div>
              </div>
            </div>
            <button className="mt-6 md:mt-0 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition flex items-center shadow-lg shadow-emerald-500/20">
              <Download className="mr-2" size={20} />
              Export P&L Statement
            </button>
          </div>

          <div className="bg-slate-900/60 rounded-xl shadow-lg border border-white/[0.06] backdrop-blur mt-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">Itemized Operating Expenses (OPEX)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Category</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pnlData.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        No expenses logged in this period.
                      </td>
                    </tr>
                  ) : (
                    pnlData.expenses.map((exp: any) => (
                      <tr key={exp._id} className="hover:bg-slate-800/50 transition">
                        <td className="px-6 py-3 text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="px-6 py-3 text-white font-medium">{exp.title}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md bg-slate-800 text-slate-300">
                            {exp.category}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right text-rose-400 font-medium">
                          ${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-bold text-white">Log Operational Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white transition">✕</button>
            </div>
            
            <form onSubmit={handleLogExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Expense Title / Description</label>
                <input 
                  type="text" 
                  required
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Monthly Rent, Payroll, Electricity Bill"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select 
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="RENT">Rent / Lease</option>
                    <option value="PAYROLL">Payroll</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="LOGISTICS">Logistics / Delivery</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="OTHER">Other Overhead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Date Incurred</label>
                <input 
                  type="date" 
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PnLReportsPage;
