import React, { useState, useEffect } from 'react';
import { Activity, Search, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

interface AuditLog {
  _id: string;
  action: string;
  targetEntity: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  details: any;
  ipAddress: string;
  timestamp: string;
}

const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [targetEntityFilter, setTargetEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = '/audit-logs?limit=100';
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (targetEntityFilter) query += `&targetEntity=${encodeURIComponent(targetEntityFilter)}`;
      
      const { data } = await api.get(query);
      setLogs(data.data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Could not load audit log data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchTerm, targetEntityFilter]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'DELETE': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="h-6 w-6 text-blue-500" />
            Audit Log Viewer
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Read-only activity feed of critical system mutations.
          </p>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
        
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-4 bg-slate-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by actor or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <select 
            value={targetEntityFilter}
            onChange={(e) => setTargetEntityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none focus:border-blue-500 [color-scheme:dark]"
          >
            <option value="">All Entities</option>
            <option value="User">User</option>
            <option value="Sale">Sale</option>
            <option value="Order">Order</option>
            <option value="InventoryBatch">InventoryBatch</option>
            <option value="Product">Product</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <ShieldAlert className="h-8 w-8 animate-pulse text-blue-500" />
                <p className="text-sm font-medium">Loading audit logs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-400">{error}</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950/50 text-slate-500 sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Entity</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{log.targetEntity}</div>
                      </td>
                      <td className="px-6 py-4">
                        {log.actorName ? (
                          <>
                            <div className="font-medium text-slate-200">{log.actorName}</div>
                            <div className="text-xs text-slate-500">{log.actorRole}</div>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded" title={JSON.stringify(log.details, null, 2)}>
                          {JSON.stringify(log.details)}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
