import React, { useEffect, useState } from 'react';
import { AlertCircle, Package, ShieldAlert, ArrowRightCircle } from 'lucide-react';
import api from '../../services/api';

interface Batch {
  _id: string;
  batchNumber: string;
  product: { name: string; sku: string; genericName: string };
  quantity: number;
  expiryDate: string;
  status: string;
  daysUntilExpiry: number;
}

const PharmacistDashboard: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarantineLoading, setQuarantineLoading] = useState<string | null>(null);
  const [reorderItem, setReorderItem] = useState('');
  const [reorderQty, setReorderQty] = useState('');
  const [reorderMsg, setReorderMsg] = useState('');

  useEffect(() => {
    fetchExpiringBatches();
  }, []);

  const fetchExpiringBatches = async () => {
    try {
      // Fetch alerts (90 days default for tracker)
      const response = await api.get('/inventory/alerts/expiry?days=90');
      // combine expiringSoon and alreadyExpired for the pharmacist view
      const allBatches = [
        ...(response.data.data.alreadyExpired || []),
        ...(response.data.data.expiringSoon || [])
      ];
      setBatches(allBatches);
    } catch (error) {
      console.error('Error fetching expiring batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuarantine = async (batchId: string) => {
    if (!window.confirm('Are you sure you want to quarantine this batch? It will no longer be available for sale.')) {
      return;
    }
    
    setQuarantineLoading(batchId);
    try {
      await api.patch(`/inventory/batches/${batchId}/quarantine`);
      fetchExpiringBatches(); // Refresh list
    } catch (error) {
      console.error('Error quarantining batch:', error);
      alert('Failed to quarantine batch.');
    } finally {
      setQuarantineLoading(null);
    }
  };

  const handleReorderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItem || !reorderQty) return;
    
    // In a full implementation, this would POST to a /requisitions endpoint
    console.log(`Submitting reorder request: ${reorderQty} of ${reorderItem}`);
    
    setReorderMsg('Reorder request submitted successfully!');
    setReorderItem('');
    setReorderQty('');
    
    setTimeout(() => setReorderMsg(''), 3000);
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Pharmacist Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Manage expiry, quarantine stock, and request reorders.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Expiry Tracker */}
        <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-900/60 p-5 rounded-2xl border border-white/[0.06] backdrop-blur">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="text-orange-500" size={20} />
              Batch Expiry Tracker
            </h2>
            <span className="text-xs px-2 py-1 bg-slate-800 rounded-md text-slate-400">Within 90 days</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Product</th>
                  <th className="px-4 py-3 font-medium">Batch</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Expires</th>
                  <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">Loading batches...</td>
                  </tr>
                ) : batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">No expiring batches found.</td>
                  </tr>
                ) : (
                  batches.map((batch) => {
                    const isExpired = batch.daysUntilExpiry < 0;
                    return (
                      <tr key={batch._id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{batch.product?.name || 'Unknown Product'}</div>
                          <div className="text-xs text-slate-500">{batch.product?.sku}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{batch.batchNumber}</td>
                        <td className="px-4 py-3">{batch.quantity}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isExpired ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </span>
                          <div className="text-xs mt-1 text-slate-500">
                            {isExpired ? 'Expired' : `${batch.daysUntilExpiry} days`}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleQuarantine(batch._id)}
                            disabled={quarantineLoading === batch._id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ShieldAlert size={14} />
                            {quarantineLoading === batch._id ? 'Quarantining...' : 'Quarantine'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column - Reorder Form */}
        <div className="flex flex-col gap-4 bg-slate-900/60 p-5 rounded-2xl border border-white/[0.06] backdrop-blur">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            <Package className="text-emerald-500" size={20} />
            Reorder Request
          </h2>
          <p className="text-sm text-slate-400 mb-2">
            Submit a request to Admin for stock replenishment.
          </p>

          <form onSubmit={handleReorderSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Product Name / SKU</label>
              <input
                type="text"
                required
                value={reorderItem}
                onChange={(e) => setReorderItem(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. Amoxicillin 500mg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Requested Quantity</label>
              <input
                type="number"
                required
                min="1"
                value={reorderQty}
                onChange={(e) => setReorderQty(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="e.g. 100"
              />
            </div>
            <button
              type="submit"
              className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowRightCircle size={16} />
              Submit Request
            </button>
            
            {reorderMsg && (
              <div className="text-xs text-emerald-400 text-center mt-2 p-2 bg-emerald-500/10 rounded-lg">
                {reorderMsg}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PharmacistDashboard;
