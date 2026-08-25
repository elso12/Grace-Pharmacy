import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Clock, DollarSign, CalendarClock, CheckCircle, Clock3 } from 'lucide-react';
import { format } from 'date-fns';

const TimesheetsPage: React.FC = () => {
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRegularHours: 0, totalOvertimeHours: 0, totalPayrollExpense: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [tsRes, sumRes] = await Promise.all([
        axios.get('http://localhost:5000/api/timesheets/admin', { withCredentials: true }),
        axios.get('http://localhost:5000/api/timesheets/admin/payroll-summary', { withCredentials: true }),
      ]);
      setTimesheets(tsRes.data.data);
      setSummary(sumRes.data.data);
    } catch (error) {
      toast.error('Failed to load timesheet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/timesheets/admin/${id}/approve`, {}, { withCredentials: true });
      toast.success('Timesheet approved');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve timesheet');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Staff Timesheets & Payroll</h1>
        <p className="text-sm text-slate-400">Review shift hours and approve payroll periods</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3">
              <Clock className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Regular Hours</p>
              <p className="text-2xl font-semibold text-white">{summary.totalRegularHours}h</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-500/10 p-3">
              <CalendarClock className="text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Overtime Hours</p>
              <p className="text-2xl font-semibold text-white">{summary.totalOvertimeHours}h</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-slate-900/50 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <DollarSign className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Est. Payroll Liability</p>
              <p className="text-2xl font-semibold text-white">${summary.totalPayrollExpense}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-white/[0.06]">
          <h3 className="text-lg font-medium text-white">Shift Log</h3>
        </div>
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Staff</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Clock In</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Clock Out</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Hours (OT)</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400">Loading timesheets...</td></tr>
            ) : timesheets.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-4 text-center text-slate-400">No shifts recorded</td></tr>
            ) : timesheets.map((ts) => (
              <tr key={ts._id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">{ts.staffName}</div>
                  <div className="text-xs text-slate-400">{ts.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {format(new Date(ts.clockIn), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {ts.clockOut ? format(new Date(ts.clockOut), 'MMM d, yyyy HH:mm') : <span className="text-yellow-400 flex items-center gap-1"><Clock3 size={14}/> Active</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                  {ts.totalHours > 0 ? (
                    <span>
                      {ts.totalHours}h {ts.overtimeHours > 0 && <span className="text-red-400 text-xs ml-1">(+{ts.overtimeHours}h OT)</span>}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${ts.status === 'APPROVED' ? 'bg-green-400/10 text-green-400' : ''}
                    ${ts.status === 'COMPLETED' ? 'bg-blue-400/10 text-blue-400' : ''}
                    ${ts.status === 'ACTIVE' ? 'bg-yellow-400/10 text-yellow-400' : ''}
                    ${ts.status === 'PAID' ? 'bg-purple-400/10 text-purple-400' : ''}
                  `}>
                    {ts.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {ts.status === 'COMPLETED' && (
                    <button
                      onClick={() => handleApprove(ts._id)}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 bg-emerald-400/10 px-2 py-1 rounded-md"
                    >
                      <CheckCircle size={14} /> Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimesheetsPage;
