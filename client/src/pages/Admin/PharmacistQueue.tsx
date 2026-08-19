import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, CheckSquare } from 'lucide-react';
import api from '../../services/api';

interface PendingOrder {
  _id: string;
  customerId: { firstName: string; lastName: string; _id: string; email: string };
  status: string;
  createdAt: string;
  items: any[];
  totalAmount: number;
}

const PharmacistQueue: React.FC = () => {
  const [queue, setQueue] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.get('/orders/pending-approval');
      setQueue(response.data.data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setApproving(id);
    try {
      await api.patch(`/orders/${id}/approve`);
      fetchQueue();
    } catch (error) {
      console.error('Error approving order:', error);
      alert('Failed to approve order.');
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Pharmacist Approval Queue</h1>
        <p className="mt-1 text-sm text-slate-400">Review pending prescription orders and approve for fulfillment.</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5 backdrop-blur">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : queue.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle size={48} className="mx-auto mb-4 text-emerald-500/50" />
            <p>No orders pending prescription approval.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((order) => (
              <div key={order._id} className="bg-slate-800/50 rounded-xl p-5 border border-white/5 transition-all hover:bg-slate-800">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      Order #{order._id.substring(order._id.length - 6).toUpperCase()}
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-medium">
                        {order.status}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-400 mt-1">
                      Customer: {order.customerId?.firstName} {order.customerId?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Clock size={16} />
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-slate-300 mb-2">Prescription Items</h4>
                  <ul className="space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-white">
                          {item.medicationId?.name} {item.medicationId?.requiresPrescription && <span className="text-red-400 text-xs ml-1">(Rx)</span>}
                        </span>
                        <span className="text-slate-400 font-mono">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleApprove(order._id)}
                    disabled={approving === order._id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckSquare size={18} />
                    {approving === order._id ? 'Approving...' : 'Approve & Release'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PharmacistQueue;
