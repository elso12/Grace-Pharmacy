import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowRightLeft, Package, CheckCircle2, Truck, Plus, X } from 'lucide-react';

const StockTransferPage: React.FC = () => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newTransfer, setNewTransfer] = useState({
    fromBranchId: '',
    toBranchId: '',
    items: [{ productId: '', productName: '', quantity: 1 }],
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [transRes, branchRes, prodRes] = await Promise.all([
        axios.get('http://localhost:5000/api/transfers', { withCredentials: true }),
        axios.get('http://localhost:5000/api/branches', { withCredentials: true }),
        axios.get('http://localhost:5000/api/products', { withCredentials: true }),
      ]);
      setTransfers(transRes.data.data);
      setBranches(branchRes.data.data);
      setProducts(prodRes.data.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id: string, action: 'dispatch' | 'receive') => {
    try {
      await axios.patch(`http://localhost:5000/api/transfers/${id}/${action}`, {}, { withCredentials: true });
      toast.success(`Transfer ${action}ed successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || `Failed to ${action} transfer`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/transfers/request', newTransfer, { withCredentials: true });
      toast.success('Transfer requested successfully');
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create request');
    }
  };

  const addItem = () => {
    setNewTransfer({
      ...newTransfer,
      items: [...newTransfer.items, { productId: '', productName: '', quantity: 1 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...newTransfer.items];
    (newItems[index] as any)[field] = value;
    
    // Auto-populate productName if productId changes
    if (field === 'productId') {
      const prod = products.find(p => p._id === value);
      if (prod) {
        newItems[index].productName = prod.name;
      }
    }
    
    setNewTransfer({ ...newTransfer, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = newTransfer.items.filter((_, i) => i !== index);
    setNewTransfer({ ...newTransfer, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Stock Transfers</h1>
          <p className="text-sm text-slate-400">Manage inter-branch inventory movements</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <ArrowRightLeft size={16} /> New Transfer Request
        </button>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-slate-900 overflow-hidden">
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Transfer ID</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Route</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Items</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-400">Loading transfers...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-4 text-center text-slate-400">No transfers found</td></tr>
            ) : transfers.map((trf) => (
              <tr key={trf._id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                  {trf.transferNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="font-semibold text-blue-400">{trf.fromBranchId?.code}</span>
                    <ArrowRightLeft size={14} className="text-slate-500" />
                    <span className="font-semibold text-emerald-400">{trf.toBranchId?.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Package size={14} />
                    <span>{trf.items.length} product(s)</span>
                  </div>
                  <div className="text-xs mt-1 text-slate-500">
                    {trf.items.reduce((acc: number, item: any) => acc + item.quantity, 0)} total units
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${trf.status === 'RECEIVED' ? 'bg-green-400/10 text-green-400' : ''}
                    ${trf.status === 'IN_TRANSIT' ? 'bg-yellow-400/10 text-yellow-400' : ''}
                    ${trf.status === 'REQUESTED' ? 'bg-blue-400/10 text-blue-400' : ''}
                  `}>
                    {trf.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {trf.status === 'REQUESTED' && (
                    <button
                      onClick={() => handleAction(trf._id, 'dispatch')}
                      className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300"
                    >
                      <Truck size={14} /> Dispatch
                    </button>
                  )}
                  {trf.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleAction(trf._id, 'receive')}
                      className="inline-flex items-center gap-1 text-green-400 hover:text-green-300"
                    >
                      <CheckCircle2 size={14} /> Receive
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 p-6 border border-white/[0.1]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Create Transfer Request</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source Branch</label>
                  <select
                    required
                    value={newTransfer.fromBranchId}
                    onChange={(e) => setNewTransfer({...newTransfer, fromBranchId: e.target.value})}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2.5"
                  >
                    <option value="">Select source...</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Destination Branch</label>
                  <select
                    required
                    value={newTransfer.toBranchId}
                    onChange={(e) => setNewTransfer({...newTransfer, toBranchId: e.target.value})}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2.5"
                  >
                    <option value="">Select destination...</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-300">Items to Transfer</label>
                  <button type="button" onClick={addItem} className="text-sm text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1">
                    <Plus size={14} /> Add Item
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newTransfer.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <div className="flex-1">
                        <select
                          required
                          value={item.productId}
                          onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                          className="w-full rounded-md bg-slate-800 border border-slate-600 text-white p-2 text-sm"
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p._id} value={p._id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <input
                          required
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full rounded-md bg-slate-800 border border-slate-600 text-white p-2 text-sm"
                          placeholder="Qty"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="p-2 text-slate-400 hover:text-red-400"
                        disabled={newTransfer.items.length === 1}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  value={newTransfer.notes}
                  onChange={(e) => setNewTransfer({...newTransfer, notes: e.target.value})}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-white p-2.5 h-20"
                  placeholder="Optional notes..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockTransferPage;
