import React, { useState } from 'react';
import { ClipboardList, Search, Send, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const CycleCountForm: React.FC = () => {
  const [batchId, setBatchId] = useState('');
  const [expectedQuantity, setExpectedQuantity] = useState('');
  const [actualQuantity, setActualQuantity] = useState('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await api.post('/inventory/count', {
        batchId: batchId.trim(),
        expectedQuantity: Number(expectedQuantity),
        actualQuantity: Number(actualQuantity),
        notes,
      });

      setMessage({ type: 'success', text: 'Cycle count submitted for review successfully.' });
      setBatchId('');
      setExpectedQuantity('');
      setActualQuantity('');
      setNotes('');
    } catch (error: any) {
      console.error('Error submitting cycle count:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit cycle count.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full p-4 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Physical Cycle Count</h1>
        <p className="mt-1 text-sm text-slate-400">Log physical stock counts for batches. Discrepancies will be sent for review.</p>
      </div>

      <div className="max-w-2xl bg-slate-900/60 rounded-2xl border border-white/[0.06] backdrop-blur p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ClipboardList className="text-emerald-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Count Entry</h2>
              <p className="text-xs text-slate-400">Scan or enter the batch details</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${
              message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              <AlertTriangle size={18} className="mt-0.5" />
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Batch ID (MongoDB ObjectId)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                required
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Paste the Batch _id here"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5 ml-1">
              *In a production environment, this would integrate with a barcode scanner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">System Expected Qty</label>
              <input
                type="number"
                required
                value={expectedQuantity}
                onChange={(e) => setExpectedQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Physical Actual Qty</label>
              <input
                type="number"
                required
                value={actualQuantity}
                onChange={(e) => setActualQuantity(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="e.g. 48"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Discrepancy Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
              placeholder="e.g. Found two damaged boxes"
            />
          </div>

          <div className="pt-2 border-t border-white/5 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Count for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CycleCountForm;
