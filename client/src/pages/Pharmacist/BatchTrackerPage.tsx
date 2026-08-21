import React, { useState, useEffect } from 'react';
import { Package, Search, AlertCircle, CheckCircle2, Clock, Loader2, ShieldAlert } from 'lucide-react';
import { getInventoryAlerts, type InventoryAlert } from '../../services/inventoryApi';
import toast from 'react-hot-toast';

const getStatus = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: 'Expired', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: AlertCircle };
  } else if (diffDays <= 30) {
    return { label: `Expiring (${diffDays}d)`, color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock };
  } else {
    return { label: 'Healthy', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
  }
};

const BatchTrackerPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [batches, setBatches] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryAlerts();
      setBatches(data);
    } catch (err) {
      console.error('[BatchTrackerPage] Failed to fetch alerts:', err);
      setError('Could not load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuarantine = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to quarantine this batch? It will be removed from active inventory.")) return;
    try {
      setLoading(true);
      const { quarantineBatch } = await import('../../services/inventoryApi');
      await quarantineBatch(batchId);
      toast.success('Batch quarantined successfully.');
      fetchBatches();
    } catch (err) {
      console.error('Failed to quarantine batch:', err);
      toast.error('Failed to quarantine batch.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = batches.filter(b => 
    b.productName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Package className="h-6 w-6 text-emerald-500" />
            FEFO Batch Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor medication expiry dates and quarantine compromised batches.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by medication name or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Medication</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mb-3 text-emerald-500" />
                      <p>Loading active batches...</p>
                    </div>
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-500 bg-rose-500/5">
                    {error}
                  </td>
                </tr>
              )}

              {!loading && !error && filteredBatches.map((batch) => {
                const status = getStatus(batch.expiryDate);
                const isOutOfStock = batch.stockLevel === 0;
                
                return (
                  <tr key={batch.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{batch.productName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-slate-400">{batch.batchNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${isOutOfStock ? 'text-rose-500' : 'text-slate-300'}`}>
                        {batch.stockLevel.toLocaleString()} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {new Date(batch.expiryDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        <status.icon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => handleQuarantine(batch.id)}
                        className="flex items-center gap-1.5 ml-auto text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" /> Quarantine
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {!loading && !error && filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No active batches found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchTrackerPage;
