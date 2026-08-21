import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { getInventoryAlerts, type InventoryAlert } from '../../services/inventoryApi';

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

const InventoryFEFOPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [batches, setBatches] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState({
    productId: '',
    batchNumber: '',
    stock: 0,
    expiryDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryAlerts();
      setBatches(data);
    } catch (err) {
      console.error('[InventoryFEFOPage] Failed to fetch alerts:', err);
      setError('Could not load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // We import addInventoryBatch from inventoryApi.ts (needs to be added to imports)
      const { addInventoryBatch } = await import('../../services/inventoryApi');
      await addInventoryBatch(
        newBatch.productId,
        newBatch.batchNumber,
        newBatch.stock,
        newBatch.expiryDate
      );
      setIsModalOpen(false);
      setNewBatch({ productId: '', batchNumber: '', stock: 0, expiryDate: '' });
      fetchBatches(); // Refresh table
    } catch (err) {
      console.error('Failed to add batch:', err);
      alert('Failed to add batch. Please check inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuarantine = async (batchId: string) => {
    if (!window.confirm("Are you sure you want to quarantine this batch?")) return;
    try {
      setLoading(true);
      const { quarantineBatch } = await import('../../services/inventoryApi');
      await quarantineBatch(batchId);
      fetchBatches();
    } catch (err) {
      console.error('Failed to quarantine batch:', err);
      alert('Failed to quarantine batch.');
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
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Package className="h-6 w-6 text-blue-500" />
            Inventory Management (FEFO)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track stock levels, manage batches, and monitor expirations.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add New Batch
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by product or batch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-white/[0.06] rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-white/[0.06] text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────── */}
      <div className="flex-1 bg-slate-900/60 border border-white/[0.06] rounded-2xl overflow-hidden backdrop-blur shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Batch Number</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock Level</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-500" />
                      <p>Loading inventory data...</p>
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
                  <tr key={batch.id} className="hover:bg-white/[0.02] transition-colors">
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
                        className="text-amber-500 hover:text-amber-400 text-sm font-medium transition-colors"
                      >
                        Quarantine
                      </button>
                    </td>
                  </tr>
                );
              })}
              
              {!loading && !error && filteredBatches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No batches found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add Batch Modal ──────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add New Batch</h2>
            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Product ID (Object ID)</label>
                <input
                  required
                  type="text"
                  value={newBatch.productId}
                  onChange={e => setNewBatch({...newBatch, productId: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Batch Number</label>
                <input
                  required
                  type="text"
                  value={newBatch.batchNumber}
                  onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Stock Quantity</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newBatch.stock}
                  onChange={e => setNewBatch({...newBatch, stock: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Expiry Date</label>
                <input
                  required
                  type="date"
                  value={newBatch.expiryDate}
                  onChange={e => setNewBatch({...newBatch, expiryDate: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:border-blue-500 [color-scheme:dark]"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryFEFOPage;
